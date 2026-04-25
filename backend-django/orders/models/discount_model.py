from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone




# ---------------
# Discount MODEL
# ---------------
class Discount(models.Model):
    """Discount/Coupon codes"""

    DISCOUNT_TYPE_CHOICES = [
        ("PERCENTAGE", "Percentage"),
        ("FIXED_AMOUNT", "Fixed Amount"),
    ]

    DISCOUNT_SOURCE = [
            ("PUBLIC", "PUBLIC"),
            ("PRIVATE", "PRIVATE"),
        ]
    
    code = models.CharField(
        max_length=12, unique=True, help_text="Coupon code (up to 12 characters only)"
    )
    discount_type = models.CharField(
        max_length=20, choices=DISCOUNT_TYPE_CHOICES, default="PERCENTAGE"
    ) 
    discount_source = models.CharField(
        max_length=20, choices=DISCOUNT_SOURCE, default="PUBLIC"
    )
    discount_fixed_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, help_text="Discount fixed amount"
    )
    discount_percentage = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, help_text="Discount Percentage"
    )

    min_order_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Minimum order amount to apply discount",
    )
    max_discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Maximum discount cap for percentage type",
    )

    valid_from = models.DateTimeField(null=True, blank=True)
    valid_to = models.DateTimeField(null=True, blank=True)

    usage_limit = models.PositiveIntegerField(
        null=True, blank=True, help_text="Total number of times this code can be used"
    )
    used_count = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.code} - {self.discount_type}"

    def is_valid(self,request=None):
        # if not self.valid_from or not self.valid_to:
        #     return False, "Validity period not set"
        """Check if discount is currently valid"""
        if request:
            print("request ===>", request.user.profile.total_orders < 1)
        
        now = timezone.now()
        if not self.is_active:
            return False, "Discount code is inactive"
        if self.valid_from and now < self.valid_from:
            return False, "Discount code not yet valid"
        if self.valid_to and now > self.valid_to:
            return False, "Discount code has expired"
        if self.code == 'FISHLO' and request and request.user.profile.total_orders:
            return request.user.profile.total_orders < 0 , "This discount is only for the first order." 
        if self.usage_limit is not None:
            if self.usage_limit <= 0:
                return False, "Discount code usage limit reached"

            if self.used_count >= self.usage_limit:
                return False, "Discount code usage limit reached"
        return True, "Valid"

    def calculate_discount(self, subtotal):
        """Calculate discount amount based on subtotal"""
        if self.min_order_amount and subtotal < self.min_order_amount:
            return 0

        if self.discount_type == "PERCENTAGE":
            discount = (subtotal * self.discount_percentage) / 100
            if self.max_discount:
                discount = min(discount, self.max_discount)
            return discount
        else:  # FIXED_AMOUNT
            return min(self.discount_fixed_amount, subtotal)

    def clean(self):
        """Validate discount values"""
        # Check if code contains lowercase letters and raise error
        if self.code and not self.code.isupper():
            raise ValidationError(
                {"code": "Discount code must be in uppercase letters only"}
            )

        if self.discount_type == "PERCENTAGE" and self.discount_percentage > 100:
            raise ValidationError("Percentage discount cannot exceed 100%")

        if self.discount_type == "FIXED_AMOUNT" and self.discount_fixed_amount < 0:
            raise ValidationError("Discount value cannot be negative")

    def save(self, *args, **kwargs):
        """Override save to ensure code is always uppercase (fallback safety)"""
        if self.code:
            self.code = self.code.upper()
        super().save(*args, **kwargs)

