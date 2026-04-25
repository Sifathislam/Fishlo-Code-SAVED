from decimal import Decimal
from products.models.product_models import Product

class PriceCalculationMixin:
    def calculate_weight(self):
       if self.product.sell_type == Product.SellType.WEIGHT and self.product_weight:
            # 1. Convert to Decimal for precision
            unit_weight = Decimal(str(self.product_weight))
            # 2. Multiply by quantity and add bonus
            return (unit_weight * self.quantity)
        
    def calculate_subtotal(self):
        qty = self.quantity or 0
        price = self.unit_price or Decimal("0.00")
        cut = getattr(self, "cut_price", Decimal("0.00")) or Decimal("0.00")
        if self.product.sell_type == Product.SellType.WEIGHT:
            # For OrderItem, weight is stored in 'weight' field
            # For CartItem, it might be 'weight_in_kg'
            weight = getattr(self, "weight", None) or getattr(self, "weight_in_kg", Decimal("0.00"))
            return (price * weight) + cut
        return (price * qty) + cut
