# discounts/services/discount_services.py

from decimal import Decimal

from ..models.cart_models import Cart
from ..models.discount_model import Discount
from ..utils.number_data_formater import format_amount


def validate_discount_service(request):
    discount_code = request.data.get("discount_code", "").strip().upper()
    cart = Cart.objects.get(user=request.user, is_active=True)
    subtotal = cart.get_subtotal()

    if not discount_code:
        return False, "Discount code is required", None, 400

    if not subtotal:
        return False, "Subtotal is required", None, 400

    try:
        subtotal = Decimal(str(subtotal))
    except (ValueError, TypeError):
        return False, "Invalid subtotal amount", None, 400

    try:
        discount = Discount.objects.get(code=discount_code)
    except Discount.DoesNotExist:
        return False, "Invalid discount code", None, 404

    is_valid, message = discount.is_valid(request)
    if not is_valid:
        return False, message, None, 400
    
    if discount.min_order_amount and subtotal < discount.min_order_amount:
        return (
            False,
            f"Minimum order amount of ₹{discount.min_order_amount} required",
            None,
            400,
        )

    discount_amount = discount.calculate_discount(subtotal)

    return (
        True,
        "Discount code applied successfully",
        {
            "code": discount.code,
            "discount_type": discount.discount_type,
            "discount_percentage": (
                float(discount.discount_percentage)
                if discount.discount_type == "PERCENTAGE"
                else None
            ),
            "discount_fixed_amount": (
                format_amount(float(discount.discount_fixed_amount))
                if discount.discount_type == "FIXED_AMOUNT"
                else None
            ),
            "discount_amount": format_amount(float(discount_amount)),
            "min_order_amount": (
                format_amount(float(discount.min_order_amount))
                if discount.min_order_amount
                else None
            ),
            "max_discount": (
                format_amount(float(discount.max_discount))
                if discount.max_discount
                else None
            ),
        },
        200,
    )
    
    
def available_discounts_service(request):
    from ..selectors.discount_selectors import get_available_discounts_queryset

    discounts = get_available_discounts_queryset()
    

    discount_list = []
    for discount in discounts:
            if discount.discount_source == 'PUBLIC':
                discount_list.append(
                    {
                        "code": discount.code,
                        "discount_type": discount.discount_type,
                        "discount_source": discount.discount_source,
                        "discount_percentage": (
                            float(discount.discount_percentage)
                            if discount.discount_type == "PERCENTAGE"
                            else None
                        ),
                        "discount_fixed_amount": (
                            float(discount.discount_fixed_amount)
                            if discount.discount_type == "FIXED_AMOUNT"
                            else None
                        ),
                        "max_discount": (
                            float(discount.max_discount) if discount.max_discount else None
                        ),
                        "min_order_amount": (
                            float(discount.min_order_amount) if discount.min_order_amount else None
                        ),
                    }
                )
    return {"success": True, "discounts": discount_list}