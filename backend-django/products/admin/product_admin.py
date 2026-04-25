from django.contrib import admin
from django.db.models import Avg, Count
from django.utils.html import format_html

from inventory.models import Inventory

from ..models import Cut, ImageGallery, Product, Review, PriceMatrix, WeightOption

# ------------
# CUT ADMIN
# ------------
@admin.register(Cut)
class CutAdmin(admin.ModelAdmin):
    list_display = (
        "product_name",
        "image_preview",
        "name",
        "is_free",
        "price",
        "product_count",
        "created_at",
    )
    list_filter = ("is_free", "product_name", "created_at")
    search_fields = (
        "name",
        "product_name",
    )
    readonly_fields = ("created_at", "image_preview")
    list_editable = ("is_free", "price")

    fieldsets = (
        ("Basic Information", {"fields": ("product_name", "name", "is_free", "price")}),
        ("Media", {"fields": ("image", "image_preview")}),
        ("Metadata", {"fields": ("created_at",), "classes": ("collapse",)}),
    )

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="80" height="80" style="object-fit: cover;" />',
                obj.image.url,
            )
        return "No Image"

    image_preview.short_description = "Preview"

    def product_count(self, obj):
        return obj.products.count()

    product_count.short_description = "Products"


# ------------
# IMAGE GALLERY INLINE
# ------------
class ImageGalleryInline(admin.TabularInline):
    model = ImageGallery
    extra = 1
    readonly_fields = ("image_preview", "created_at")
    fields = ("image", "image_preview", "created_at")

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="100" height="100" style="object-fit: cover;" />',
                obj.image.url,
            )
        return "No Image"

    image_preview.short_description = "Preview"


# ------------
# REVIEW INLINE
# ------------
class ReviewInline(admin.TabularInline):
    model = Review
    extra = 0
    readonly_fields = ("user", "star", "comment", "created_at")
    can_delete = False
    fields = ("user", "star", "is_approved", "comment", "created_at")

    def has_add_permission(self, request, obj=None):
        return False


# ---------------
# INVENTORY INLINE (shows all locations)
# ---------------
class InventoryInline(admin.TabularInline):
    model = Inventory
    extra = 0
    readonly_fields = ("sku", "created_at", "last_updated")
    fields = (
        "storagelocation",
        "sku",
        "stock_kg",
        "stock_pieces",
        "is_bargainable",
        "last_updated",
    )

    def has_add_permission(self, request, obj=None):
        # Prevent adding inventory from product admin
        # Should be managed from Inventory admin
        return True


class PriceMatrixInline(admin.TabularInline):
    model = PriceMatrix
    extra = 0
    fields = (
        "storage_location",
        "wholesale_price",
        "regular_price",
        "display_price",
        "bargain_price",
        "min_price",
        "is_active",
    )
    autocomplete_fields = ["storage_location"]


# ---------------
# PRODUCT ADMIN
# ---------------
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "subcategory",
        "get_inventory_locations",
        "is_available",
        "min_weight",
        "review_count",
        "avg_rating",
        "created_at",
    )
    list_filter = ("is_available", "category", "subcategory", "created_at")
    search_fields = ("name", "short_description", "tags__name", "inventory__sku")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "avg_rating", "review_count")
    list_editable = ("is_available",)
    autocomplete_fields = ["category", "subcategory"]
    filter_horizontal = ("cuts",)
    inlines = [ImageGalleryInline, PriceMatrixInline, ReviewInline, InventoryInline]

    fieldsets = (
        ("Classification", {"fields": ("category", "subcategory")}),
        (
            "Basic Information",
            {
                "fields": (
                    "name",
                    "slug",
                    "short_description",
                    "details",
                    "featured_image",
                )
            },
        ),
        (
            "Product Details",
            {
                "fields": (
                    "sell_type",
                    "pack_weight_kg",
                    "min_weight",
                    "expected_net_weight_min_per_kg",
                    "expected_net_weight_max_per_kg",
                    "cuts",
                    "tags",
                    "is_available",
                    "min_pieces",
                    "max_pieces",
                    "min_serves",
                    "max_serves",
                )
            },
        ),
        (
            "Statistics",
            {"fields": ("review_count", "avg_rating"), "classes": ("collapse",)},
        ),
        (
            "Metadata",
            {"fields": ("created_at", "deleted_at"), "classes": ("collapse",)},
        ),
    )

    def get_inventory_locations(self, obj):
        """Display all storage locations where this product has inventory"""
        inventories = obj.inventory.select_related("storagelocation").all()
        if not inventories:
            return format_html('<span style="color: red;">No Inventory</span>')

        locations = []
        for inv in inventories:
            stock_info = f"{inv.stock_kg}kg / {inv.stock_pieces}pcs"
            locations.append(f"{inv.storagelocation.name}: {stock_info}")

        return format_html("<br>".join(locations))

    get_inventory_locations.short_description = "Inventory Locations"

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(
            _review_count=Count("reviews"), _avg_rating=Avg("reviews__star")
        ).prefetch_related("inventory__storagelocation")
        return queryset

    def review_count(self, obj):
        return obj._review_count

    review_count.short_description = "Reviews"
    review_count.admin_order_field = "_review_count"

    def avg_rating(self, obj):
        if obj._avg_rating:
            return round(obj._avg_rating, 1)
        return "No ratings"

    avg_rating.short_description = "Avg Rating"
    avg_rating.admin_order_field = "_avg_rating"


# ------------
# IMAGE GALLERY ADMIN
# ------------
@admin.register(ImageGallery)
class ImageGalleryAdmin(admin.ModelAdmin):
    list_display = ("product", "image_preview", "created_at")
    list_filter = ("created_at",)
    search_fields = ("product__name",)
    readonly_fields = ("created_at", "image_preview")
    autocomplete_fields = ["product"]

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="150" height="150" style="object-fit: cover;" />',
                obj.image.url,
            )
        return "No Image"

    image_preview.short_description = "Preview"


class WeightOptionAdmin(admin.ModelAdmin):
    list_display = ['product', 'weight_kg', 'is_active', 'sort_order']

admin.site.register(WeightOption, WeightOptionAdmin)