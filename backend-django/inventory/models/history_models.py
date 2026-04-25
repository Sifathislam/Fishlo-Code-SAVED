from django.db import models

from accounts.models import User
from products.models import Product

from .storage_models import StorageLocation


class InventoryHistory(models.Model):

    ACTION_CHOICES = [
        ("UPDATE", "Updated"),
        ("RESTOCK", "Restocked"),
        ("SALE", "Sale"),
        ("PRICE_UPDATE", "PRICE_UPDATE"),
        ("ADJUSTMENT", "Adjustment"),
        ("RETURN", "Return"),
    ]

    inventory = models.ForeignKey(
        "Inventory", on_delete=models.CASCADE, related_name="history"
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="inventory_history"
    )
    storage_location = models.ForeignKey(
        StorageLocation, on_delete=models.CASCADE, related_name="inventory_history"
    )

    # Who made the change
    updated_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_history",
    )

    # Stock levels before and after
    stock_kg_before = models.DecimalField(max_digits=10, decimal_places=3)
    stock_kg_after = models.DecimalField(max_digits=10, decimal_places=3)
    stock_pieces_before = models.DecimalField(max_digits=10, decimal_places=2)
    stock_pieces_after = models.DecimalField(max_digits=10, decimal_places=2)

    # Prices at time of update
    wholesale_price = models.DecimalField(max_digits=10, decimal_places=2)
    regular_price = models.DecimalField(max_digits=10, decimal_places=2)
    display_price = models.DecimalField(max_digits=10, decimal_places=2)
    bargain_price = models.DecimalField(max_digits=10, decimal_places=2)
    min_price = models.DecimalField(max_digits=10, decimal_places=2)

    # Action type
    action_type = models.CharField(
        max_length=20, choices=ACTION_CHOICES, default="UPDATE"
    )

    # Store detailed changes as JSON
    changes = models.JSONField(
        default=dict, blank=True, help_text="Detailed changes in JSON format"
    )

    # Notes/reason for change
    notes = models.TextField(blank=True, null=True)

    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Inventory Histories"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["product", "-created_at"]),
            models.Index(fields=["inventory", "-created_at"]),
            models.Index(fields=["storage_location", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.action_type} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

    @property
    def stock_kg_change(self):
        """Calculate the change in kg stock"""
        return self.stock_kg_after - self.stock_kg_before

    @property
    def stock_pieces_change(self):
        """Calculate the change in pieces stock"""
        return self.stock_pieces_after - self.stock_pieces_before
