from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models



# ---------------
# TAX CONFIGURATION MODEL
# ---------------
class TaxConfiguration(models.Model):
    """
    Global tax configuration - Single row table
    Manages GST/VAT settings for the entire application
    """

    TAX_TYPE_CHOICES = [
        ("GST", "GST (Goods and Services Tax)"),
    ]

    tax_type = models.CharField(
        max_length=10,
        choices=TAX_TYPE_CHOICES,
        default="GST",
        help_text="Type of tax applied",
    )
    tax_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=5.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Tax percentage (e.g., 5.00 for 5%)",
    )
    is_active = models.BooleanField(
        default=True, help_text="Enable/disable tax calculation"
    )
    is_inclusive = models.BooleanField(
        default=False,
        help_text="If True, tax is included in product price. If False, tax is added on top",
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tax_updates",
    )

    class Meta:
        verbose_name = "Tax Configuration"
        verbose_name_plural = "Tax Configuration"

    def __str__(self):
        return f"{self.tax_type} - {self.tax_percentage}%"

    def save(self, *args, **kwargs):
        # Ensure only one configuration exists (singleton pattern)
        if not self.pk and TaxConfiguration.objects.exists():
            raise ValidationError(
                "Only one tax configuration can exist. Please update the existing one."
            )
        super().save(*args, **kwargs)

    @classmethod
    def get_active_tax(self):
        """Get the active tax configuration"""
        config = self.objects.first()
        if config and config.is_active:
            return config
        return None

    @classmethod
    def get_tax_percentage(self):
        """Get current tax percentage"""
        config = self.get_active_tax()
        return config.tax_percentage if config else 0

    def calculate_tax(self, amount):
        """Calculate tax amount for given price"""
        if not self.is_active:
            return Decimal("0.00")

        amount = Decimal(str(amount))

        return (amount * self.tax_percentage) / 100

    def get_base_price(self, total_price):
        """Get base price without tax (if tax is inclusive)"""
        if not self.is_active or not self.is_inclusive:
            return Decimal(str(total_price))

        total_price = Decimal(str(total_price))
        tax_rate = self.tax_percentage / 100
        return total_price / (1 + tax_rate)

    def get_total_with_tax(self, base_price):
        """Get total price with tax added (if tax is exclusive)"""
        if not self.is_active:
            return Decimal(str(base_price))

        base_price = Decimal(str(base_price))

        if self.is_inclusive:
            return base_price  # Already includes tax
        else:
            return base_price + self.calculate_tax(base_price)
