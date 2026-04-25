from django.core.validators import MinValueValidator
from django.db import models

from products.models import Product

from .history_models import InventoryHistory
from .storage_models import StorageLocation
from decimal import Decimal
from ..selectors.inventory_selectors import get_price_matrix
class Inventory(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="inventory"
    )
    storagelocation = models.ForeignKey(StorageLocation, on_delete=models.CASCADE)
    # Stock tracking
    stock_kg = models.DecimalField(max_digits=10,decimal_places=3,default=0,validators=[MinValueValidator(0)],help_text="Stock quantity in kilograms",)
    stock_pieces = models.PositiveIntegerField(blank=True, null=True, default=0,help_text="Stock quantity in pieces")
    # Product info
    min_pieces_per_kg = models.PositiveIntegerField(blank=True, null=True, help_text="Minimum pieces in 1kg (e.g., 8 for 8-10)")
    max_pieces_per_kg = models.PositiveIntegerField(blank=True, null=True, help_text="Maximum pieces in 1kg (e.g., 10 for 8-10)")
    sku = models.CharField(max_length=100, unique=True, blank=True, null=True)
    is_bargainable = models.BooleanField(default=True)

    # Metadata
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Inventories"
        ordering = ["-last_updated"]
        constraints = [
            models.UniqueConstraint(
                fields=["product", "storagelocation"],
                name="unique_product_storage_location",
            ),
        ]

    def __str__(self):
        return (
            f"{self.product.name} - Stock: {self.stock_kg}kg / {self.stock_pieces}pcs"
        )
    @property
    def price_matrix(self):
        return self.product.get_price_matrix(self.storagelocation)
    
    @property
    def pieces_per_kg_display(self):
        if self.min_pieces_per_kg and self.max_pieces_per_kg:
            if self.min_pieces_per_kg == self.max_pieces_per_kg:
                return str(self.min_pieces_per_kg)
            return f"{self.min_pieces_per_kg}-{self.max_pieces_per_kg}"
        return "N/A"
    
    @property
    def price_matrix(self):
        if not hasattr(self, "_price_matrix_cache"):
            self._price_matrix_cache = get_price_matrix(
                self.product,
                self.storagelocation
            )
        return self._price_matrix_cache
    @property
    def product_display_price(self):
        return self.price_matrix.display_price if self.price_matrix else 0


    @property
    def product_wholesale_price(self):
        return self.price_matrix.wholesale_price if self.price_matrix else 0


    @property
    def product_regular_price(self):
        return self.price_matrix.regular_price if self.price_matrix else 0


    @property
    def product_bargain_price(self):
        return self.price_matrix.bargain_price if self.price_matrix else 0


    @property
    def product_min_price(self):
        return self.price_matrix.min_price if self.price_matrix else 0

    def is_out_of_stock(self):
        # Weight based product
        if self.product.sell_type == 'WEIGHT':
            if self.stock_kg <= 0:
                return True
            else: 
                return False

        # Piece based product
        if self.stock_pieces <= 0:
            return True

        return False


    def is_bargainable_product(self):
        return self.is_bargainable

    def save(self, *args, **kwargs):

        is_update = self.pk is not None
        user = kwargs.pop("user", None)
        skip_history = kwargs.pop("skip_history", False)

        if is_update and not skip_history:
            try:
                old_instance = Inventory.objects.get(pk=self.pk)
                self._create_history_record(old_instance, user)
            except Inventory.DoesNotExist:
                pass
        super().save(*args, **kwargs)

        if not is_update:
            InventoryHistory.objects.create(
                inventory=self,
                product=self.product,
                storage_location=self.storagelocation,
                updated_by=user,
                changes={"initial_stock": "New inventory created"},
                stock_kg_before=0,
                stock_kg_after=self.stock_kg,
                stock_pieces_before=0,
                stock_pieces_after=self.stock_pieces,
                wholesale_price=self.product_wholesale_price,
                regular_price=self.product_regular_price,
                display_price=self.product_display_price,
                bargain_price=self.product_bargain_price,
                min_price=self.product_min_price,
                action_type="RESTOCK",
                notes="Initial inventory creation",
            )
        self._update_product()

    def _create_history_record(self, old_instance, user):
        changes = {}
        if old_instance.stock_kg != self.stock_kg:
            changes["stock_kg"] = {
                "old": float(old_instance.stock_kg),
                "new": float(self.stock_kg),
                "change": float(self.stock_kg - old_instance.stock_kg),
            }

        if old_instance.stock_pieces != self.stock_pieces:
            changes["stock_pieces"] = {
                "old": float(old_instance.stock_pieces),
                "new": float(self.stock_pieces if self.stock_pieces else 0),
                "change": float(self.stock_pieces - old_instance.stock_pieces),
            }

        if changes:
            InventoryHistory.objects.create(
                inventory=self,
                product=self.product,
                storage_location=self.storagelocation,
                updated_by=user,
                changes=changes,
                stock_kg_before=old_instance.stock_kg,
                stock_kg_after=self.stock_kg,
                stock_pieces_before=old_instance.stock_pieces,
                stock_pieces_after=self.stock_pieces,
                wholesale_price=self.product_wholesale_price,
                regular_price=self.product_regular_price,
                display_price=self.product_display_price,
                bargain_price=self.product_bargain_price,
                min_price=self.product_min_price,
                
            )

    def _update_product(self):

        inventories = Inventory.objects.filter(product=self.product)
        if not inventories.exists():
            return

        total_stock_kg = sum(inv.stock_kg for inv in inventories)
        total_stock_pieces = sum(inv.stock_pieces for inv in inventories)

        product = self.product
        product.is_available = total_stock_kg >= 0 or total_stock_pieces >= 0

        product.save(update_fields=["is_available"])
