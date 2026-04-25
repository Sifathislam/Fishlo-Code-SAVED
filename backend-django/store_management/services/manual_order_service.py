# orders/services/manual_order_service.py
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from inventory.models import Inventory, StorageLocation
from products.models import Product, WeightOption, Cut
from orders.utils.number_data_formater import format_amount
from orders.models.orders_models import Order, OrderItem, OrderAddress, OrderTracking
from orders.models.discount_model import Discount

from products.utils import (
    get_location_inventory,
    get_user_storage_location,
    is_in_delivery_zone_func,
)
from orders.selectors.cart_selectors import get_inventory
from ..models import StoreManagerProfile

def _d(value):
    return Decimal(str(value))

@transaction.atomic
def create_manual_order_service(*, request, data):

    store_manage_profile = (StoreManagerProfile.objects.filter(user=request.user).select_related('storage_location').first())
    if not store_manage_profile or not store_manage_profile.storage_location:
        raise ValidationError(f"Your account isn’t linked to any store yet. Please ask the admin to assign you to a store location.")
    storage_location = store_manage_profile.storage_location
    PAYMENT_METHOD_MAP = {
        "cash": "CASH",
        "upi_online": "UPI_ONLINE",
    }
    payment_method = PAYMENT_METHOD_MAP.get(data.get("payment_method", "cash"), "CASH")
    catalog_products = [p for p in data["products"] if p.get("type") == "catalog"]
    custom_products = [p for p in data["products"] if p.get("type") == "custom"]

    raw_phone = str(data.get("customer_phone", "")).strip()
    normalized_phone = f"+91{raw_phone}" if len(raw_phone) == 10 and raw_phone.isdigit() else raw_phone
    product_ids = [p["id"] for p in catalog_products]
    products = Product.objects.filter(id__in=product_ids).prefetch_related("cuts", "weight_options")
    product_map = {p.id: p for p in products}

    missing = [pid for pid in product_ids if pid not in product_map.keys()]
    if missing:
        raise ValidationError(f"Some items in your order are no longer available. Please remove them and try again.")

    # Lock inventory rows for update
    inventories = Inventory.objects.select_for_update().filter(
        storagelocation=storage_location, product_id__in=product_ids
    )
    inv_map = {inv.product_id: inv for inv in inventories}

    no_inv = [pid for pid in product_ids if pid not in inv_map]
    if no_inv:
        raise ValidationError(f"One or more items are not available in this store. Please choose a different item.")

    # Handle discount
    discount_amount = Decimal("0.00")
    discount_percentage = 0
    discount_fixed_amount = Decimal("0.00")
    discount_code = ""

    if data["discount_type"] == "manual":
        discount_amount = _d(data.get("discount_value", "0.00"))
        discount_code = None

    elif data["discount_type"] == "coupon":
        code = (data.get("discount_code") or "").strip().upper()
        print("code ", code)
        if not code:
            raise ValidationError(f"Please enter a valid coupon code.")
        disc = Discount.objects.filter(code=code).first()
        if not disc:
            raise ValidationError(f"Please enter a valid coupon code.")

        # You can reuse your disc.is_valid(request) if it depends on user
        is_valid, msg = disc.is_valid(request)
        if not is_valid:
            raise ValidationError(f"This coupon can’t be used right now: {msg}")

        discount_code = disc.code
        # discount amount will be computed after we compute temp subtotal (same as online flow)

    # Create order (manual store)
    order = Order.objects.create(
        user=None,  # walk-in
        storage_location=storage_location,
        source=Order.OrderSource.MANUAL_STORE,
        created_by=request.user,
        customer_name=data.get("customer_name", ""),
        customer_phone=normalized_phone,
        payment_method=payment_method,  
        payment_status="PAID",             
        status=Order.OrderStatus.DELIVERED,
        delivery_charge=Decimal("0.00"),
        discount_code=discount_code,
        discount_amount=Decimal("0.00"),
        discount_percentage=0,
        discount_fixed_amount=Decimal("0.00"),
        subtotal=Decimal("0.00"),
        total_weight=Decimal("0.00"),
        total_pieces=0,
        total_amount=Decimal("0.00"),
    )

    # Create OrderAddress snapshot
    if data["purchase_type"] == "home_delivery":
        addr = data["delivery_address"]
        OrderAddress.objects.create(
            order=order,
            user_address=request.user,
            point=storage_location.point,
            billing_address=None,
            full_name=data["customer_name"],
            email=None,
            phone=normalized_phone,
            house_details=addr["flat_no"],
            address_line_2=addr.get("street"),
            city=addr["city"],
            state=addr["state"],
            postal_code=str(addr["pincode"]),
            country="India",
            is_billing_same_as_shipping=True,
        )
    else:
        # walk-in: create minimal address record with only geo point (needed for zone-based order filtering)
        # but do NOT store the shop address as house_details
        OrderAddress.objects.create(
            order=order,
            point=storage_location.point,
            billing_address=None,
            full_name=data["customer_name"],
            email=None,
            phone=normalized_phone,
            house_details="",  # no address for walk-in
            country="India",
            is_billing_same_as_shipping=True,
        )

    created_items = []

    # Build items + deduct stock
    for block in data["products"]:
        # -------------------------
        # CUSTOM PRODUCT LOGIC
        # -------------------------
        if block.get("type") == "custom":

            name = block.get("name")
            weight = _d(block.get("weight", 0))
            cut_price = _d(block.get("cut_price", 0))
            price_per_kg = _d(block.get("price_per_kg", 0))
            quantity = _d(block.get("quantity", 0))
            pieces = _d(block.get("pieces", 0))
            total_price = _d(block.get("total_price", 0))
            sell_type = block.get("sell_type")
            print(block)
            print(sell_type)

            if not name:
                raise ValidationError("Custom product name is required")
            if not sell_type:
                raise ValidationError("Sell type is required")
                
            # calculate if not provided
            if not total_price:
                total_price = weight * price_per_kg

            # Calculate subtotal as (base_price * quantity) + cut_price
            item_subtotal = (total_price * quantity) + cut_price

            if item_subtotal <= 0:
                raise ValidationError("Price must be greater than 0")

            oi = OrderItem(
                order=order,
                is_custom=True,
                product=None,

                product_name=name,
                product_weight=weight,
                custom_note=block.get("note"),

                entered_by=request.user,
                quantity=quantity,
                weight=weight,
                pieces=pieces,
                sell_type=sell_type,
                unit_price=total_price,
                cut_price=cut_price,
                original_price=total_price,
                subtotal=format_amount(item_subtotal),
            )

            created_items.append(oi)

            continue  #IMPORTANT → skip catalog logic

        product = product_map.get(block["id"])
        if not product:
            raise ValidationError(f"Product with ID {block['id']} is not available.")
        inv = inv_map[product.id]

        price_matrix = product.get_price_matrix(storage_location)
        if not price_matrix:
            raise ValidationError(f"We can’t calculate the price for {product.name} in this store right now. Please try another item or contact support.")
        unit_price = _d(price_matrix.display_price)
        for wc in block["weight_and_cuts"]:
            qty = int(wc["quantity"])
            cut_obj = None
            if wc.get("cut_id"):
                cut_obj = product.cuts.filter(id=wc["cut_id"]).first()
                if not cut_obj:
                    raise ValidationError(f"The selected cut option for {product.name} is not available. Please choose another cut.")
            retail_price_val = wc.get("retail_price_per_kg")
            if retail_price_val is None or _d(retail_price_val) == 0:
                retail_price = unit_price
            else:
                retail_price = _d(retail_price_val)


            # Determine kg/pieces deduction
            weight_kg = Decimal("0.00")
            pieces = None

            product_weight_snapshot = None

            if product.sell_type == Product.SellType.WEIGHT:
                custom_weight = wc.get("custom_weight")
                print("custom_weight ", custom_weight)
                if custom_weight:
                    product_weight_snapshot = _d(custom_weight)
                else:
                    wid = wc.get("weight_id")
                    if not wid:
                        raise ValidationError(f"Please select a weight option for {product.name} (for example: 250g / 500g / 1kg).")
                    wobj = product.weight_options.filter(id=wid, is_active=True).first()
                    if not wobj:
                        raise ValidationError(f"The selected weight option for {product.name} is not available right now. Please choose a different weight.")

                    product_weight_snapshot = _d(wobj.weight_kg)

                weight_kg = product_weight_snapshot * _d(qty)

                # stock check + deduct
                if inv.stock_kg < weight_kg:
                    raise ValidationError(f"Sorry, {product.name} doesn’t have enough stock for the selected weight.")
                inv.stock_kg = inv.stock_kg - weight_kg

                cut_price = _d(cut_obj.price) if cut_obj else _d(0)
                # subtotal for WEIGHT: base * weight (already includes qty) + flat cut price
                subtotal = format_amount((retail_price * weight_kg) + cut_price).quantize(Decimal("0.00"))

            else:
                # PIECE or PACK -> treat as per quantity
                pieces = qty
                if (inv.stock_pieces or 0) < qty:
                    raise ValidationError(f"Sorry, {product.name} is out of stock for the requested quantity")
                inv.stock_pieces = (inv.stock_pieces or 0) - qty
                
                cut_price = _d(cut_obj.price) if cut_obj else _d(0)
                # subtotal for PIECE/PACK: (base * qty) + flat cut price
                subtotal = ((retail_price * _d(qty)) + cut_price).quantize(Decimal("0.00"))
            print("subtotal ===>",subtotal)

            inv.save(user=request.user)  
            print("weight before save to db =>", weight_kg)
            oi = OrderItem(
                order=order,
                product=product,
                product_name=product.name,
                product_image=product.featured_image if product.featured_image else None,
                product_weight=product_weight_snapshot,
                sku=product.sku,
                quantity=qty,
                weight=weight_kg if product.sell_type == Product.SellType.WEIGHT else 0,
                pieces=pieces if product.sell_type != Product.SellType.WEIGHT else 0,
                unit_price=retail_price,
                sell_type=product.sell_type,
                cut_price=cut_price,
                original_price=product.regular_price or unit_price,
                subtotal=subtotal,
            )
            created_items.append(oi)

    created_db_items = OrderItem.objects.bulk_create(created_items)

    # set cuts M2M
    # (bulk_create doesn't handle m2m; do it after)
    idx = 0
    for block in data["products"]:
        if block.get("type") == "custom":
            idx += 1
            continue

        product = product_map.get(block["id"])
        if not product:
            raise ValidationError(f"Product with ID {block['id']} is not available.")

        for wc in block["weight_and_cuts"]:
            cut_id = wc.get("cut_id")            
            if cut_id:
                created_db_items[idx].selected_cuts.set([cut_id])
            idx += 1

    # Now compute discount if coupon (needs subtotal)
    order.calculate_totals()

    if data["discount_type"] == "manual":
        order.discount_amount = format_amount(discount_amount)
        order.save(update_fields=["discount_amount"])
        order.calculate_totals()

    elif data["discount_type"] == "coupon":
        disc = Discount.objects.get(code=discount_code)
        # mimic your online logic:
        temp_subtotal = order.subtotal
        order.discount_amount = format_amount(disc.calculate_discount(temp_subtotal))
        if disc.discount_type == "PERCENTAGE":
            order.discount_percentage = int(disc.discount_percentage)
        if disc.discount_type == "FIXED_AMOUNT":
            order.discount_fixed_amount = disc.discount_fixed_amount
        order.save(update_fields=["discount_amount", "discount_percentage", "discount_fixed_amount"])
        order.calculate_totals()

        disc.used_count += 1
        disc.save(update_fields=["used_count"])

    return order
