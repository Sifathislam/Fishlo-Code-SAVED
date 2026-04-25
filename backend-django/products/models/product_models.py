import uuid

from ckeditor_uploader.fields import RichTextUploadingField
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q, F
from django.utils.text import slugify
from taggit.managers import TaggableManager

from .category_models import Category, SubCategory
from orders.utils.number_data_formater import format_weight

# ------------
# CUTS Model
# ------------
class Cut(models.Model):
    product_name = models.CharField(max_length=100, blank=True, null=True)
    name = models.CharField(max_length=100)
    image = models.ImageField(upload_to="images/cuts/", blank=True, null=True)
    is_free = models.BooleanField(default=False)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product_name} - {self.name}"


# ---------------
# PRODUCT Model
# ---------------
class Product(models.Model):
    class SellType(models.TextChoices):
        WEIGHT = "WEIGHT", "By Weight (per kg)"
        PIECE = "PIECE", "By Piece"
        PACK = "PACK", "Fixed Pack"

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
        blank=True,
        null=True,
    )
    subcategory = models.ForeignKey(
        SubCategory,
        on_delete=models.PROTECT,
        related_name="products",
        blank=True,
        null=True,
    )

    name = models.CharField(max_length=250)
    chat_name = models.CharField(max_length=100, blank=True, null=True)
    slug = models.SlugField(max_length=400, unique=True, blank=True)
    featured_image = models.ImageField(upload_to="images/featured_image/")
    short_description = models.TextField()
    details = RichTextUploadingField()
    min_weight = models.FloatField(help_text="Weight in kg")

    sell_type = models.CharField(
        max_length=20, choices=SellType.choices, default=SellType.WEIGHT, db_index=True
    )
    pack_weight_kg = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Pack size in kg (only if sell_type=PACK). Example: 0.500 for 500g",
    )

    min_pieces = models.PositiveIntegerField(blank=True, null=True)
    max_pieces = models.PositiveIntegerField(blank=True, null=True)
    min_serves = models.PositiveIntegerField(blank=True, null=True)
    max_serves = models.PositiveIntegerField(blank=True, null=True)

    expected_net_weight_min_per_kg = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="Min expected net weight as % of gross (e.g. 70 for 70%)"
    )
    expected_net_weight_max_per_kg = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="Max expected net weight as % of gross (e.g. 80 for 80%)"
    )

    cuts = models.ManyToManyField(Cut, blank=True, related_name="products")
    is_available = models.BooleanField(default=True)

    # Tags using django-taggit
    tags = TaggableManager(help_text="Add tags like: fish, seafood, prawns", blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(auto_now_add=False, blank=True, null=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.name}-{uuid.uuid4()}")
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    def get_chat_name(self):
        """
        Conversational short name for Meena Tai.
        Priority:
        1️⃣ chat_name (manual override)
        2️⃣ First tag (if exists)
        3️⃣ First part of product.name
        """

        if self.chat_name:
            return self.chat_name.strip()

        # TaggableManager returns a queryset
        first_tag = self.tags.first()
        if first_tag:
            return first_tag.name.strip()

        # Fallback: first part before slash
        return self.name.split("/")[0].strip()

    # ========================================
    # INVENTORY HELPER METHODS
    # ========================================

    def get_inventory(self, storage_location=None, storage_location_id=None):

        # Check if we have prefetched location_inventory (for optimization)
        if hasattr(self, "location_inventory") and self.location_inventory:
            return self.location_inventory[0]

        # Filter by storage_location if provided
        if storage_location:
            return self.inventory.get(storagelocation=storage_location)

        # Fallback: return first inventory
        return self.inventory.first()

    @property
    def sku(self):
        """Get SKU from first available inventory"""
        inventory = self.get_inventory()
        return inventory.sku if inventory and inventory.sku else ""

    def get_price_matrix(self, storage_location=None):
        """
        Retrieves the active price matrix.
        Prioritizes prefetched 'active_prices' for performance.
        """
        if hasattr(self, "active_prices"):
            # If we prefetched active prices for a specific location in the view
            return self.active_prices[0] if self.active_prices else None

        query = self.prices.filter(is_active=True)
        if storage_location:
            return query.filter(storage_location=storage_location).first()

        return query.first()
    
    def get_display_price(self, storage_location=None):
        matrix = self.get_price_matrix(storage_location)
        return matrix.display_price if matrix else None

    @property
    def wholesale_price(self):
        matrix = self.get_price_matrix()
        return matrix.wholesale_price if matrix else None

    @property
    def regular_price(self):
        matrix = self.get_price_matrix()
        return matrix.regular_price if matrix else None

    @property
    def display_price(self,storage_location=None):
        matrix = self.get_price_matrix(storage_location)
        print(matrix)
        return matrix.display_price if matrix else None

    @property
    def bargain_price(self):
        matrix = self.get_price_matrix()
        return matrix.bargain_price if matrix else None

    @property
    def min_price(self):
        matrix = self.get_price_matrix()
        return matrix.min_price if matrix else None

    # ========================================
    # STOCK PROPERTIES
    # ========================================

    @property
    def total_stock_kg(self):
        """Get total stock in kg across all storage locations"""
        return sum(inv.stock_kg for inv in self.inventory.all())

    @property
    def total_stock_pieces(self):
        """Get total stock in pieces across all storage locations"""
        return sum(inv.stock_pieces or 0 for inv in self.inventory.all())

    @property
    def is_in_stock(self):
        """Check if product is in stock in any location"""
        return self.total_stock_kg > 0 or self.total_stock_pieces > 0

    def get_stock_by_location(self, storage_location=None, storage_location_id=None):
        """
        Get stock information for specific location.
        Returns dict with stock details.
        """
        inventory = self.get_inventory(storage_location, storage_location_id)
        if inventory:
            return {
                "stock_kg": inventory.stock_kg,
                "stock_pieces": inventory.stock_pieces,
                "is_bargainable": inventory.is_bargainable,
                "is_out_of_stock": inventory.is_out_of_stock(),
            }
        return None


class PriceMatrix(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="prices")
    storage_location = models.ForeignKey(
        "inventory.StorageLocation",
        on_delete=models.CASCADE,
    )
    wholesale_price = models.DecimalField(max_digits=10, decimal_places=2) # the price that I purchased
    regular_price = models.DecimalField(max_digits=10, decimal_places=2) # striked price on the PDP
    display_price = models.DecimalField(max_digits=10, decimal_places=2) # display price on the PDP
    bargain_price = models.DecimalField(max_digits=10, decimal_places=2) # this is the price where meena tai should try her best to sell, emotionally like real fisherwoman, without overacting.
    min_price = models.DecimalField(max_digits=10, decimal_places=2) # this price will be given to customers based on scenarios like time of the day, inventory stock, customer behaviour, past orders etc.

    valid_from = models.DateTimeField(null=True, blank=True)
    valid_to = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["product", "storage_location"],
                condition=Q(is_active=True),
                name="one_active_price_matrix",
            ),
            models.CheckConstraint(
                condition=Q(min_price__lte=F("bargain_price")),
                name="min_price_is_lowest",
            ),
            models.CheckConstraint(
                condition=Q(bargain_price__lte=F("display_price")),
                name="bargain_not_above_display",
            ),
            models.CheckConstraint(
                condition=Q(display_price__lte=F("regular_price")),
                name="display_not_above_regular",
            ),
        ]

    def clean(self):
        errors = {}
        if (
            self.min_price is not None
            and self.bargain_price is not None
            and self.min_price > self.bargain_price
        ):
            errors["bargain_price"] = "Bargain price must be equal to or higher than the minimum price."

        if (
            self.bargain_price is not None
            and self.display_price is not None
            and self.bargain_price > self.display_price
        ):
            errors["display_price"] = "Display price must be equal to or higher than the bargain price."

        if (
            self.display_price is not None
            and self.regular_price is not None
            and self.display_price > self.regular_price
        ):
            errors["regular_price"] = "Regular price must be equal to or higher than the display price."

        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"{self.product} @ {self.storage_location}"


# --------------------
# IMAGE GALLERY Model
# --------------------
class ImageGallery(models.Model):
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="gallery")
    image = models.ImageField(upload_to="images/product_gallery/")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.product.name}"


class WeightOption(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="weight_options")
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, help_text="Selectable weight in kg (0.25, 0.5, 1.0)")
    min_pieces = models.PositiveIntegerField(blank=True, null=True)
    max_pieces = models.PositiveIntegerField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_better_value = models.BooleanField(default=False)
    label = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        ordering = ["sort_order", "weight_kg"]
        unique_together = ("product", "weight_kg")

    @property
    def display_label(self):
        if self.label:
            return self.label

        return f"{format_weight(self.weight_kg,self.product,0)}"