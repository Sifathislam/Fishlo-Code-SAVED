from django.db import models
from django.conf import settings
from products.models.product_models import PriceMatrix,Product
from inventory.models.storage_models import StorageLocation

class PriceHistory(models.Model):
    class Action(models.TextChoices):
        CREATED = "CREATED", "Created"
        UPDATED = "UPDATED", "Updated"
        DEACTIVATED = "DEACTIVATED", "Deactivated"

    price_matrix = models.ForeignKey(PriceMatrix,on_delete=models.SET_NULL,null=True,blank=True,related_name="history",)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="price_history")
    storage_location = models.ForeignKey(StorageLocation, on_delete=models.CASCADE)
    action = models.CharField(max_length=20, choices=Action.choices)
    
    # who changed
    user = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,null=True,blank=True,related_name="price_changes",)

    # OLD values
    old_wholesale_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    old_regular_price   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    old_display_price   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    old_bargain_price   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    old_min_price       = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # NEW values
    new_wholesale_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    new_regular_price   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    new_display_price   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    new_bargain_price   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    new_min_price       = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["storage_location", "-created_at"]),
            models.Index(fields=["product", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.product} @ {self.storage_location} ({self.action})"
