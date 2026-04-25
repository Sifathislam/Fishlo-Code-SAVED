from decimal import Decimal

from django.db.models import Count

from ..models.orders_models import Order,OrderItem,OrderAddress
from ..utils.number_data_formater import format_weight
from ..selectors.cart_selectors import get_weight_obj
from products.models import WeightOption
from products.utils import get_location_inventory

def get_cart_item_total_quantity(cart, product, cut_ids=None):

    if cut_ids:
        # Find cart item with specific cuts
        for item in cart.items.filter(product=product).prefetch_related(
            "selected_cuts"
        ):
            existing_cut_ids = sorted(
                item.selected_cuts.values_list("id", flat=True))
            if (
                existing_cut_ids == sorted(cut_ids)
                if isinstance(cut_ids, list)
                else [cut_ids]
            ):
                return item.quantity
        return 0
    else:
        # Find cart item without cuts
        cart_item = (
            cart.items.filter(product=product)
            .annotate(cuts_count=Count("selected_cuts"))
            .filter(cuts_count=0)
            .first()
        )

        return cart_item.quantity if cart_item else 0


def find_existing_cart_item(cart, product, cut_ids=None):

    if cut_ids:
        # Normalize cut_ids to list
        if not isinstance(cut_ids, list):
            cut_ids = [cut_ids]

        # Find item with matching cuts
        for item in cart.items.filter(product=product).prefetch_related(
            "selected_cuts"
        ):
            existing_cut_ids = sorted(
                item.selected_cuts.values_list("id", flat=True))
            if existing_cut_ids == sorted(cut_ids):
                return item
        return None
    else:
        # Find item without cuts
        return (
            cart.items.filter(product=product)
            .annotate(cuts_count=Count("selected_cuts"))
            .filter(cuts_count=0)
            .first()
        )

def get_cart_item_with_cuts(cart, product, cut_id=None, weight_obj=None):
    """
    Finds an existing cart item that matches the product, selected weight, AND selected cuts.
    """
    # Start by filtering items for this product and weight
    items = cart.items.filter(product=product, product_weight=weight_obj)

    if cut_id:
        # If a single cut_id is passed, normalize it to a list
        target_cut_ids = [int(cut_id)] if not isinstance(cut_id, list) else [int(i) for i in cut_id]
        
        for item in items.prefetch_related("selected_cuts"):
            existing_cut_ids = list(item.selected_cuts.values_list("id", flat=True))
            if sorted(existing_cut_ids) == sorted(target_cut_ids):
                return item
    else:
        # Find item without any cuts
        return items.annotate(cuts_count=Count("selected_cuts")).filter(cuts_count=0).first()
    
    return None

def calculate_total_weight_and_pieces_in_cart(cart, product, exclude_item_id=None,product_weight_in_kg=0):

    cart_items = cart.items.filter(product=product)

    if exclude_item_id:
        cart_items = cart_items.exclude(id=exclude_item_id)

    total_weight = Decimal("0")
    total_pieces = 0
    for item in cart_items:
        if item.product.sell_type == "WEIGHT":
            item_weight = Decimal(str(item.weight_in_kg))
            total_weight += (item_weight + item.bonus_weight_in_kg)
        else:
            total_pieces += item.quantity 
    return total_weight,total_pieces


def get_available_stock_info(inventory, product):

    stock_kg = Decimal(str(inventory.stock_kg)
                       ) if inventory.stock_kg else Decimal("0")
    stock_pieces = inventory.stock_pieces if inventory.stock_pieces else 0

    # Determine stock type
    has_kg = stock_kg > 0 and product.sell_type == "WEIGHT"
    has_pieces = stock_pieces > 0 and product.sell_type != "WEIGHT"

    if has_kg:
        stock_type = "kg_only"
        primary_unit = "kg"
    elif has_pieces:
        stock_type = "pieces_only"
        primary_unit = "pieces"
    else:
        stock_type = "none"
        primary_unit = None

    return {
        "available_kg": stock_kg,
        "available_pieces": stock_pieces,
        "unit": primary_unit,
        "stock_type": stock_type,
    }


def check_stock_availability(
    inventory, product, requested_quantity, existing_weight_in_cart=None,existing_pieces_in_cart=0,product_weight_in_kg=0
):
    if inventory and inventory.is_out_of_stock():
        return False, "Product is out of stock", None

    stock_info = get_available_stock_info(inventory, product)

    # Calculate requested weight
    requested_weight = Decimal(str(product_weight_in_kg)) * requested_quantity
    requested_pieces = requested_quantity
    # Calculate total weight needed (existing + requested)
    if existing_weight_in_cart:
        total_weight_needed = existing_weight_in_cart + requested_weight
    else:
        total_weight_needed = requested_weight
    if existing_pieces_in_cart:
        total_pieces_needed = existing_pieces_in_cart + requested_pieces
    else:
        total_pieces_needed = requested_pieces

    # Check based on stock type
    if stock_info["stock_type"] == "kg_only":
        # Primary check: weight-based
        available_kg = stock_info["available_kg"]

        if total_weight_needed > available_kg:
            # Calculate how many items can fit
            max_quantity_possible = int(
                available_kg / product_weight_in_kg)

            if existing_weight_in_cart:
                existing_quantity = int(
                    existing_weight_in_cart / product_weight_in_kg
                )
                remaining_quantity = max_quantity_possible - existing_quantity

                if remaining_quantity <= 0:
                    return (
                        False,
                        f"Cannot add more items. Available stock: {available_kg}kg. You already have {existing_weight_in_cart}kg in your cart.",
                        {
                            "available_kg": available_kg,
                            "requested_weight": requested_weight,
                            "total_weight_needed": total_weight_needed,
                        },
                    )
                else:
                    return (
                        False,
                        f"Only Available Stock is {available_kg}kg",
                        {
                            "available_kg": available_kg,
                            "requested_weight": requested_weight,
                            "total_weight_needed": total_weight_needed,
                        },
                    )
            else:
                return (
                    False,
                    f"Only available Stock is {available_kg}kg)",
                    {
                        "available_kg": available_kg,
                        "requested_weight": requested_weight,
                    },
                )

    elif stock_info["stock_type"] == "pieces_only":
        # Fallback: pieces-based check
        available_pieces = stock_info["available_pieces"]
        if total_pieces_needed > available_pieces:
            remaining_pieces = available_pieces - (
                existing_pieces_in_cart if existing_pieces_in_cart else 0
            )

            if remaining_pieces <= 0:
                return (
                    False,
                    f"Cannot add more items. Available: {available_pieces} pieces. You already have {existing_pieces_in_cart} items in your cart.",
                    {
                        "available_pieces": available_pieces,
                        "requested_quantity": requested_quantity,
                    },
                )
            else:
                return (
                    False,
                    f"Only {remaining_pieces} more pieces can be added (Available: {available_pieces} pieces)",
                    {
                        "available_pieces": available_pieces,
                        "max_quantity_possible": remaining_pieces,
                    },
                )

    # Stock is sufficient
    return (
        True,
        None,
        {
            "available_kg": stock_info["available_kg"],
            "requested_weight": requested_weight,
            "total_weight_needed": total_weight_needed,
        },
    )


def validate_cart_item_increase(cart_item, inventory):

    product = cart_item.product
    cart = cart_item.cart
    try:
        weight_id = cart_item.product_weight.id if cart_item.product_weight else None
        weight_obj = get_weight_obj(weight_id, product)
    except WeightOption.DoesNotExist:
        weight_obj = None
    # Calculate existing weight for this product (excluding current item)
    existing_weight,existing_pieces = calculate_total_weight_and_pieces_in_cart(
        cart, product, exclude_item_id=cart_item.id,product_weight_in_kg=weight_obj.weight_kg if weight_obj else 0)

    if product.sell_type == 'WEIGHT':
        # Add current item's weight
        current_item_weight = Decimal(str(cart_item.weight_in_kg))
        existing_weight += current_item_weight

        # Check if we can add 1 more
        is_available, error_msg, details = check_stock_availability(
            inventory, product, 1, existing_weight,existing_pieces ,product_weight_in_kg=weight_obj.weight_kg if weight_obj else 0 # Try to add 1 more
        )
    else:
        current_item_pieces = cart_item.pieces
        existing_pieces += current_item_pieces        
        is_available, error_msg, details = check_stock_availability(
            inventory, product, 1, existing_weight,existing_pieces  # Try to add 1 more
        )
    return is_available, error_msg


def validate_cart_item_quantity_update(cart_item, new_quantity, inventory):
    product = cart_item.product
    cart = cart_item.cart

    # Calculate existing weight for this product (excluding current item being updated)
    existing_weight,existing_pieces = calculate_total_weight_and_pieces_in_cart(
        cart, product, exclude_item_id=cart_item.id
    )

    # Check if new quantity is available
    is_available, error_msg, details = check_stock_availability(
        inventory, product, new_quantity, existing_weight,existing_pieces
    )

    return is_available, error_msg


def get_cart_summary(cart):

    return {
        "subtotal": float(cart.get_subtotal()),
        "total_weight": float(cart.get_total_weight()),
        "items_count": cart.get_items_count(),
    }


def get_max_addable_quantity(inventory, product, existing_weight_in_cart=None,existing_pieces_in_cart=0,product_weight_in_kg=0):

    if inventory and inventory.is_out_of_stock():
        return 0

    stock_info = get_available_stock_info(inventory, product)
    product_weight = Decimal(str(product_weight_in_kg))

    if stock_info["stock_type"] in ["kg_only", "both"]:
        available_kg = stock_info["available_kg"]

        if existing_weight_in_cart:
            remaining_kg = available_kg - existing_weight_in_cart
        else:
            remaining_kg = available_kg

        if remaining_kg <= 0:
            return 0

        max_quantity = int(remaining_kg / product_weight)
        return max(0, max_quantity)

    elif stock_info["stock_type"] == "pieces_only":
        available_pieces = stock_info["available_pieces"]

        if existing_pieces_in_cart:
            return max(0, available_pieces - existing_pieces_in_cart)
        else:
            return available_pieces

    return 0


def order_creator_util(request, delivery_charge, validated_discount_code, discount_amount, discount_percentage, discount_fixed_amount, partial_payment_amount, notes, payment_method,storage_location=None):
    order = Order.objects.create(
        user=request.user,
        storage_location=storage_location,
        subtotal=Decimal("0"),
        vat_amount=Decimal("0"),
        delivery_charge=delivery_charge,
        total_amount=Decimal("0"),
        total_weight=Decimal("0"),
        discount_code=validated_discount_code,
        discount_amount=discount_amount,
        discount_percentage=discount_percentage,
        discount_fixed_amount=discount_fixed_amount,
        partial_pay=partial_payment_amount,  # Set partial payment
        remaining_amount=Decimal(
            "0"
        ),  # Will be calculated after calculate_totals()
        notes=notes,
        status="PENDING",
        payment_status="PENDING",
        payment_method=payment_method,
    )
    return order
 

def order_billing_util(full_name,phone_number,email,house_details,city,state,postal_code):
     billing_address = {
                "full_name": full_name,
                "phone_number": phone_number,
                "email": email,
                "house_details": house_details,
                "city": city,
                "state": state,
                "postal_code": postal_code,
            }
     return billing_address


def order_item_creator_util(order,cart_items):
    order_items = [
        OrderItem(
            order=order,
            product=item.product,
            product_name=item.product.name,
            product_image=item.product.featured_image,
            sku=item.product.sku,
            quantity=item.quantity,
            pieces=item.quantity,
            unit_price=item.unit_price,
            original_price=item.product.regular_price,
            cut_price=item.cut_price,
            weight=item.weight_in_kg,
            product_weight=item.product_weight.weight_kg if item.product_weight else 0,
            weight_option_label_snapshot=item.product_weight.label if item.product_weight and item.product_weight.label else None,
            subtotal=item.get_subtotal(),
            sell_type=item.product.sell_type,
            expected_net_weight_min_per_kg_snapshot=item.product.expected_net_weight_min_per_kg if item.product.expected_net_weight_min_per_kg else None, 
            expected_net_weight_max_per_kg_snapshot=item.product.expected_net_weight_max_per_kg if item.product.expected_net_weight_max_per_kg else None, 
            
        )
        for item in cart_items
    ]
    return order_items

def order_address_creator_util(user_address,order,request,billing_address,is_billing_same_as_shipping):
      # Create address snapshot
    order_address =  OrderAddress.objects.create(
            order=order,
            user_address=user_address,
            point=user_address.point,
            full_name=user_address.recipient_name,
            email=request.user.email,
            phone=user_address.recipient_phone,
            house_details=user_address.house_details,
            address_line_2=user_address.address_line_2 or "",
            city=user_address.city,
            state=user_address.state,
            postal_code=user_address.postal_code,
            country=user_address.country,
            billing_address=billing_address,
            is_billing_same_as_shipping=is_billing_same_as_shipping,
        )
    return order_address

def get_out_of_stock_items(cart_items, storage_location):
    errors = []

    for item in cart_items:
        inventory = get_location_inventory(item.product, {"storage_location": storage_location})

        if not inventory:
            errors.append(item.product.name)
            continue

        if item.product.sell_type == "WEIGHT" and inventory.stock_kg <= 0:
            errors.append(item.product.name)

        if item.product.sell_type in ("PIECE", "PACK") and inventory.stock_pieces <= 0:
            errors.append(item.product.name)

    # Optional: remove duplicates
    return list(dict.fromkeys(errors))