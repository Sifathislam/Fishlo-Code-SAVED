from decimal import Decimal, ROUND_HALF_UP
from products.models.product_models import Product
def calculate_cart_item_fields(*, product, quantity, weight_obj=None,user_storage_location=None):
    """
    Returns dict with fields to set on CartItem based on product.sell_type.
    """
    qty = int(quantity or 1)
    base_price = product.get_display_price(user_storage_location) or Decimal("0.00")
    

    # WEIGHT product
    if product.sell_type == Product.SellType.WEIGHT:
        if not weight_obj:
            raise ValueError("weight_obj is required for WEIGHT products")

        price_per_kg = base_price
        unit_weight = Decimal(str(weight_obj.weight_kg))          # e.g 0.25
        total_weight = unit_weight * Decimal(qty)                 # e.g 0.25 * 2 = 0.50
        # 10% surcharge if < 1kg option
        single_unit_price = (unit_weight * price_per_kg)
        rounded_unit_price = single_unit_price.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        total_unit_price = rounded_unit_price 
        

        return {
            "unit_price": total_unit_price,
            "price_per_kg": price_per_kg,
            "weight_in_kg": total_weight,
        }

    # PIECE product
    unit_price = base_price.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return {
        "unit_price": unit_price,
        "price_per_kg": None,
        "weight_in_kg": None,
    }
 