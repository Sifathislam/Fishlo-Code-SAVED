from decimal import Decimal,ROUND_HALF_UP

from django.db import models
from django.db.models import Q

from accounts.models import User
from products.models import Cut, Product, WeightOption

from ..mixins.price_mixins import PriceCalculationMixin
from orders.utils.number_data_formater import format_amount
from ..models.tax_models import TaxConfiguration
# ---------------
# CART MODEL
# ---------------


class Cart(models.Model):
    """Main cart model for storing user's shopping cart"""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="carts", null=True, blank=True
    )
    session_key = models.CharField(
        max_length=255, null=True, blank=True, help_text="For guest users"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            # Logged-in users
            models.UniqueConstraint(
                fields=["user"],
                condition=Q(is_active=True, user__isnull=False),
                name="unique_active_cart_per_user",
            ),
            # Guest users
            models.UniqueConstraint(
                fields=["session_key"],
                condition=Q(is_active=True, user__isnull=True),
                name="unique_active_cart_per_session",
            ),
        ]

    def __str__(self):
        if self.user:
            return f"Cart - {self.user.email}"
        return f"Guest Cart - {self.session_key}"

    def get_subtotal(self):
        """Calculate subtotal of all cart items"""
        return sum(item.get_total() for item in self.items.all())

    def get_tax_amount(self):
        return sum(item.get_tax_amount() for item in self.items.all())

    # def get_total_weight(self):
    #     """Calculate total weight of all items"""
    #     return sum(item.get_total_weight() for item in self.items.all())
    def get_total_weight(self):
        """Sum up all item weights using Decimal precision."""
        return sum((item.get_total_weight() for item in self.items.all()), Decimal("0.00"))


    def get_items_count(self):
        """Get total number of items in cart"""
        return self.items.count()


# ---------------
# CART Item MODEL
# ---------------
class CartItem(PriceCalculationMixin, models.Model):
    """Individual items in the cart"""

    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    product_weight = models.ForeignKey(WeightOption, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True,null=True, help_text="Price at time of adding to cart")
    selected_cuts = models.ManyToManyField(Cut, blank=True, related_name="cart_items")
    cut_price = models.DecimalField(max_digits=10,decimal_places=2,default=0.00,help_text="Total price for selected cuts",)
    weight_in_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Weight in kg (e.g. 0.25, 0.5)")
    bonus_weight_in_kg = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"), help_text="Free bonus weight in kg (AI only)")
    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Price per kg at time of adding to cart")
    pieces= models.PositiveIntegerField(blank=True, null=True, help_text="Item in pieces")

    is_bargained = models.BooleanField(default=False, help_text="Whether this item's price was negotiated via AI")
    bargain_session_id = models.CharField(max_length=100, null=True, blank=True, help_text="Reference to AI negotiation session (for audit trail)")
    original_price_per_kg = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Original display price before negotiation")
    negotiated_price_per_kg = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Final negotiated price per kg")
    price_locked_until = models.DateTimeField(null=True, blank=True, help_text="Price is guaranteed until this time (1 hour after negotiation)")
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"), help_text="Total discount from negotiation (for display)")
    
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-added_at"]

    def __str__(self):
        if self.product.sell_type == Product.SellType.WEIGHT:
            return f"{self.product.name} - {self.weight_in_kg}kg"
        return f"{self.product.name} x {self.quantity}"

 
    # def get_total_weight(self):
    #     from decimal import Decimal

    def get_total_weight(self):
        if (
            self.product.sell_type == Product.SellType.WEIGHT
            and self.product_weight
        ):
            unit_weight = self.product_weight.weight_kg  # already Decimal
            quantity = Decimal(self.quantity)

            bonus = self.bonus_weight_in_kg or Decimal("0.00")

            return (unit_weight * quantity) + bonus
        else:
            return Decimal("0.00")


    def get_subtotal(self):
        """Subtotal without cuts (null-safe)"""
        if self.product.sell_type == Product.SellType.WEIGHT:
            qty = self.quantity or 0            
            price = self.unit_price or Decimal("0.00")
            return price * qty

        qty = self.quantity or 0
        price = self.unit_price or Decimal("0.00")
        return price * qty

    def get_total(self):
        return self.get_subtotal()

    def get_tax_amount(self):
        """Calculate tax for this cart item"""
        tax_config = TaxConfiguration.get_active_tax()
        if tax_config:
            return tax_config.calculate_tax(self.get_total())

        return Decimal("0.00")

    def save(self, *args, **kwargs):
        # Unit price should be taken from product if missing/null
        if self.product.sell_type == Product.SellType.WEIGHT:
            base_price = self.product.display_price or Decimal("0.00")
            
            if self.product_weight:
                # alculate the TOTAL weight (e.g., 0.25 * 1)
                unit_weight = Decimal(str(self.product_weight.weight_kg))
                self.weight_in_kg = unit_weight * self.quantity
                
                #  Apply 10% surcharge if the chosen weight option is < 1kg
                if unit_weight < Decimal("1.00"):
                    calc_price_per_kg = base_price * Decimal("1.10")
                else:
                    calc_price_per_kg = base_price
                
                #  Always round the price per kg to a whole number
                self.price_per_kg = calc_price_per_kg

            elif not self.price_per_kg:
                self.price_per_kg = base_price
                    
        else:
            if not self.unit_price and self.product:
                base_price = self.product.display_price or Decimal("0.00")
                self.unit_price = base_price.quantize(Decimal("1"), rounding=ROUND_HALF_UP)

        super().save(*args, **kwargs)
