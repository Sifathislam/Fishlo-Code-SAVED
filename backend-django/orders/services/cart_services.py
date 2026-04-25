# services/cart_services.py

import json

from django.shortcuts import get_object_or_404
from decimal import Decimal

from inventory.models import Inventory
from products.models import Product, Cut
from ..models.cart_models import Cart, CartItem
from products.models.product_models import WeightOption
from products.utils import (
    get_location_inventory,
    get_user_storage_location,
    is_in_delivery_zone_func,
    get_product_max_stock
)
from delivery.services.delivery_charge_service import get_delivery_charge_for_distance, get_delivery_distance
from ..models.tax_models import TaxConfiguration

from ..selectors.cart_selectors import get_inventory,get_weight_obj

from ..utils.utils import (
    calculate_total_weight_and_pieces_in_cart,
    check_stock_availability,
    get_cart_item_with_cuts,
    get_max_addable_quantity,
    validate_cart_item_increase,
    validate_cart_item_quantity_update,
)

from ..utils.number_data_formater import format_amount, format_weight
from ..utils.calculate_cart_item_fields import calculate_cart_item_fields

def add_to_cart_service(request, *, get_or_create_cart):

    data = json.loads(request.body)
    product_id = data.get("product_id")
    quantity = int(data.get("quantity", 1))
    weight_id= data.get("product_weight_id",0)
    bonus_weight_in_kg = data.get("bonus_weight_in_kg",0)
    cut_id = data.get("cut_ids", 0)
    user_storage_location = get_user_storage_location(request)

    if not product_id or quantity < 1:
        return False, "Invalid product or quantity", None, 400

    product = get_object_or_404(Product, id=product_id, is_available=True)
    if not weight_id and product.sell_type=='WEIGHT':
        return False, "Weight not found for this product", None, 404
    if product.sell_type == 'WEIGHT':
        try:
            weight_obj = get_weight_obj(weight_id, product)
            product_weight_in_kg = weight_obj.weight_kg
        except WeightOption.DoesNotExist:
            return False, "Weight not found for this product", None, 404
    else:
        weight_obj = None
        product_weight_in_kg=0
    try:
        inventory = get_inventory(request, product)
        if inventory is None or inventory.is_out_of_stock():
            return False, "Product is out of stock", None, 400
    except Inventory.DoesNotExist:
        return False, "Product inventory not found", None, 400

    cart, cart_id = get_or_create_cart(request)
   
    cart_item = get_cart_item_with_cuts(cart, product, cut_id, weight_obj=weight_obj)

    existing_weight,existing_pieces = calculate_total_weight_and_pieces_in_cart(cart, product,product_weight_in_kg=product_weight_in_kg)

    is_available, error_msg, details = check_stock_availability(
        inventory, product, quantity, existing_weight,product_weight_in_kg=product_weight_in_kg
    )

    if not is_available:
        max_addable = get_max_addable_quantity(inventory, product, existing_weight,existing_pieces,product_weight_in_kg)
        if max_addable > 0:
            return (
                False,
                f"{error_msg} You can add up to {max_addable} more items.",
                {"max_addable_quantity": max_addable},
                400,
            )
        return False, error_msg, None, 400
    if cart_item:
        cart_item.quantity += quantity
        cart_item.pieces += quantity

        pricing = calculate_cart_item_fields(
            product=product,
            quantity=cart_item.quantity,   # use UPDATED quantity
            weight_obj=weight_obj,
            user_storage_location=user_storage_location,
        )
        

        cart_item.unit_price = pricing["unit_price"]
        cart_item.price_per_kg = pricing["price_per_kg"]
        cart_item.weight_in_kg = pricing["weight_in_kg"]

        cart_item.save()

    else:
        pricing = calculate_cart_item_fields(
            product=product,
            quantity=quantity,
            weight_obj=weight_obj,
            user_storage_location=user_storage_location,
        )
                
        cart_item = CartItem.objects.create(
            cart=cart,
            product=product,
            product_weight=weight_obj,
            quantity=quantity,
            pieces=quantity,
            bonus_weight_in_kg=bonus_weight_in_kg,

            unit_price=pricing["unit_price"],
            price_per_kg=pricing["price_per_kg"],
            weight_in_kg=pricing["weight_in_kg"],
        )
    if cut_id:
        cuts = Cut.objects.filter(id=cut_id)
        cart_item.selected_cuts.set(cuts)
        cart_item.cut_price = sum(cut.price for cut in cuts if not cut.is_free)
        cart_item.save()

    response_data = {
        "cart_items_count": cart.get_items_count(),
        "cart_subtotal": format_amount(float(cart.get_subtotal())),
        "cart_total_weight": float(cart.get_total_weight()),
        "item_quantity": cart_item.quantity,
        "item_weight": round(float(cart_item.get_total_weight()), 2),
        "item_total": format_amount(float(cart_item.get_total())),
    }

    if cart_id:
        response_data["cart_id"] = cart_id

    return True, "Product added to cart successfully", response_data, 200


def update_cart_item_service(request, *, item_id, get_or_create_cart):
    data = json.loads(request.body)
    quantity = int(data.get("quantity", 1))

    if quantity < 1:
        return False, "Quantity must be at least 1", None, 400

    cart, cart_id = get_or_create_cart(request)
    cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)

    try:
        inventory = get_inventory(request, cart_item.product)
        is_valid, error_msg = validate_cart_item_quantity_update(
            cart_item, quantity, inventory
        )
        if not is_valid:
            return False, error_msg, None, 400

    except Inventory.DoesNotExist:
        return False, "Product inventory not found", None, 400

    cart_item.quantity = quantity
    cart_item.save()

    return (
        True,
        "Cart updated successfully",
        {
            "item_quantity": cart_item.quantity,
            "item_weight": float(cart_item.get_total_weight()),
            "item_total": format_amount(float(cart_item.get_total())),
            "cart_subtotal": format_amount(float(cart.get_subtotal())),
            "cart_total_weight": float(cart.get_total_weight()),
            "cart_items_count": cart.get_items_count(),
        },
        200,
    )


def increase_cart_item_service(request, *, item_id, get_or_create_cart):
    cart, cart_id = get_or_create_cart(request)
    cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)

    try:
        inventory = get_inventory(request, cart_item.product)
        can_increase, error_msg = validate_cart_item_increase(cart_item, inventory)
        if not can_increase:
            return False, error_msg, None, 400

    except Inventory.DoesNotExist:
        return False, "Product inventory not found", None, 400

    cart_item.quantity += 1
    cart_item.pieces+=1
    cart_item.save()

    return (
        True,
        "Quantity increased",
        {
            "item_quantity": cart_item.quantity,
            "item_weight": float(cart_item.get_total_weight()),
            "item_total": format_amount(float(cart_item.get_total())),
            "cart_subtotal": format_amount(float(cart.get_subtotal())),
            "cart_total_weight": float(cart.get_total_weight()),
        },
        200,
    )


def decrease_cart_item_service(request, *, item_id, get_or_create_cart):
    cart, cart_id = get_or_create_cart(request)
    cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)

    if cart_item.quantity <= 1:
        cart_item.delete()
        return (
            True,
            "Item removed from cart",
            {
                "item_removed": True,
                "cart_subtotal": format_amount(float(cart.get_subtotal())),
                "cart_total_weight": float(cart.get_total_weight()),
                "cart_items_count": cart.get_items_count(),
            },
            200,
        )

    cart_item.quantity -= 1
    cart_item.pieces-=1
    cart_item.save()

    return (
        True,
        "Quantity decreased",
        {
            "item_quantity": cart_item.quantity,
            "item_weight": float(cart_item.get_total_weight()),
            "item_total": format_amount(float(cart_item.get_total())),
            "cart_subtotal": format_amount(float(cart.get_subtotal())),
            "cart_total_weight": float(cart.get_total_weight()),
        },
        200,
    )


def remove_cart_item_service(request, *, item_id, get_or_create_cart):
    cart, cart_id = get_or_create_cart(request)
    cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
    cart_item.delete()

    return (
        True,
        "Item removed from cart",
        {
            "cart_subtotal": format_amount(float(cart.get_subtotal())),
            "cart_total_weight": float(cart.get_total_weight()),
            "cart_items_count": cart.get_items_count(),
        },
        200,
    )


def clear_cart_service(request, *, get_or_create_cart):
    cart, cart_id = get_or_create_cart(request)
    cart.items.all().delete()
    return True, "Cart cleared successfully", None, 200


def cart_detail_service(request, *, get_or_create_cart):
    cart, cart_id = get_or_create_cart(request)
    address_id = request.GET.get("address_id")

    try:
        address_id = int(address_id) if address_id else None
    except ValueError:
        address_id = None
    if address_id:
        user_storage_location = get_user_storage_location(request, address_id)
    else:
        user_storage_location = get_user_storage_location(request)
    if request.user.is_authenticated:
        is_first_order = request.user.profile.total_orders < 1
    else:
        is_first_order = False
    delivery_distance = get_delivery_distance(address_id,user_storage_location)
    delivery_charge = get_delivery_charge_for_distance(storagelocation=user_storage_location,distance_km=delivery_distance)
    tax_config = TaxConfiguration.get_active_tax()
    items = []
    
    for item in cart.items.select_related("product", "product_weight").prefetch_related("selected_cuts"):
        try:
            context = {"storage_location": user_storage_location}
            inventory_product = get_location_inventory(item.product, context)

            is_in_delivery_zone = is_in_delivery_zone_func(item.product, context)
            product_max_stock = get_product_max_stock(inventory_product, item.product)
            sell_type = item.product.sell_type

            if inventory_product is None:
                is_out_of_stock = True

            elif sell_type == "WEIGHT":
                is_out_of_stock = inventory_product.stock_kg <= 0

            elif sell_type in ("PIECE", "PACK"):
                is_out_of_stock = inventory_product.stock_pieces <= 0

        except Inventory.DoesNotExist:
            is_out_of_stock = True
            is_in_delivery_zone = False
            
        weight = item.product_weight.display_label if item.product_weight else "0g"
        
        items.append(
            {
                "id": item.id,
                "product_id": item.product.id,
                "product_name": item.product.name,
                "product_slug": item.product.slug,
                "product_weight_id": item.product_weight.id if item.product_weight else None,
                "product_image": (
                    request.build_absolute_uri(item.product.featured_image.url)
                    if item.product.featured_image
                    else None
                ),
                "quantity": item.quantity,
                "unit_price": format_amount(float(item.unit_price)),
                "unit_tax_amount": format_amount(float(item.get_tax_amount())),
                "cut_price": format_amount(float(item.cut_price)),
                "isOutOfStock": is_out_of_stock,
                "isInDeliveryZone": is_in_delivery_zone,
                "product_max_stock":product_max_stock,
                "minimum_order_amount":user_storage_location.minimum_order_amount if user_storage_location else format_amount(Decimal(0.00)),
                "minimum_pre_order_amount":user_storage_location.minimum_pre_order_amount if user_storage_location else format_amount(Decimal(0.00)),
                "partial_pay_pre_order_percentage":user_storage_location.partial_pay_pre_order_percentage if user_storage_location else 0,

                "total": format_amount(float(item.get_total())),
                "weight": weight,
                "is_weighted_product": True if item.product.sell_type =="WEIGHT" else False,
                "selected_cuts": [
                    {"id": cut.id, "name": cut.name, "price": float(cut.price)}
                    for cut in item.selected_cuts.all()
                ],
            }
        )

    return (
        True,
        None,
        {
            "items": items,
            "subtotal": format_amount(float(cart.get_subtotal())),
            "total_weight": float(cart.get_total_weight()),
            "total_tax": format_amount(float(cart.get_tax_amount())),
            "tax_percentage": round(float(tax_config.tax_percentage), 2),
            "minimum_bargain_amount":format_amount(user_storage_location.minimum_bargain_amount) if user_storage_location else format_amount(Decimal(0.00)),
            "minimum_order_amount":format_amount(user_storage_location.minimum_order_amount) if user_storage_location else format_amount(Decimal(0.00)),
            "min_cod_amount": format_amount(user_storage_location.min_cod_amount) if user_storage_location else format_amount(Decimal("299.00")),
            "max_cod_amount": format_amount(user_storage_location.max_cod_amount) if user_storage_location else format_amount(Decimal("1999.00")),
            "items_count": cart.get_items_count(),
            "delivery_charge":delivery_charge,
            "is_first_order":is_first_order,
        },
        200,
    )


def merge_cart_service(request, *, get_or_create_cart):
    if not request.user.is_authenticated:
        return False, "User must be authenticated", None, 401

    data = json.loads(request.body)
    guest_cart_id = data.get("cart_id")

    if not guest_cart_id:
        return False, "Guest cart_id is required", None, 400

    guest_cart = Cart.objects.filter(
        session_key=guest_cart_id, user__isnull=True, is_active=True
    ).first()

    if not guest_cart or guest_cart.items.count() == 0:
        return True, "No guest cart to merge", None, 200

    user_cart, created = Cart.objects.get_or_create(user=request.user, is_active=True)

    user_items = list(user_cart.items.prefetch_related("selected_cuts").all())

    user_item_map = {}
    for item in user_items:
        cut_ids = frozenset(item.selected_cuts.values_list("id", flat=True))
        user_item_map[(item.product_id, cut_ids)] = item

    for guest_item in guest_cart.items.prefetch_related("selected_cuts").all():
        guest_cut_ids = frozenset(guest_item.selected_cuts.values_list("id", flat=True))
        lookup_key = (guest_item.product_id, guest_cut_ids)

        user_item = user_item_map.get(lookup_key)

        if user_item:
            user_item.quantity += guest_item.quantity
            user_item.save()
            guest_item.delete()
        else:
            guest_item.cart = user_cart
            guest_item.save()

    guest_cart.is_active = False
    guest_cart.save()

    return (
        True,
        "Cart merged successfully",
        {
            "cart_items_count": user_cart.get_items_count(),
            "cart_subtotal": float(user_cart.get_subtotal()),
        },
        200,
    )
