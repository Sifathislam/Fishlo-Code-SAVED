from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from django.db.models import Sum
from django.utils.html import format_html

from ..models import Inventory, InventoryHistory, StorageLocation


# -------------------------------
# StorageLocation Admin
# -------------------------------
@admin.register(StorageLocation)
class StorageLocationAdmin(GISModelAdmin):
    wkt_field = "point"
    default_zoom = 12
    list_display = ["name", "location", "minimum_order_amount","capacity_kg", "capacity_pieces", "created_at"]
    search_fields = ["name", "location"]
    list_filter = ["created_at"]
    readonly_fields = ["created_at", "updated_at"]


# -------------------------------
# Inventory Admin
# -------------------------------
@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = [
        "product_name",
        "storage_location_name",
        "stock_display",
        # "price_range",
        "availability_status",
        "last_updated",
    ]

    list_filter = [
        "storagelocation",
        "last_updated",
        "product__category",
        "product__is_available",
    ]

    search_fields = ["product__name", "storagelocation__name"]

    readonly_fields = [
        "created_at",
        "last_updated",
        "pieces_per_kg_display",
        "view_history",
    ]

    fieldsets = (
        (
            "Product Information",
            {
                "fields": (
                    "product",
                    "storagelocation",
                )
            },
        ),
        (
            "Stock Levels",
            {
                "fields": (
                    "stock_kg",
                    "stock_pieces",
                )
            },
        ),
        (
            "Product Details",
            {
                "fields": (
                    "min_pieces_per_kg",
                    "max_pieces_per_kg",
                    "pieces_per_kg_display",
                    "is_bargainable",
                )
            },
        ),
        (
            "Metadata",
            {
                "fields": (
                    "created_at",
                    "last_updated",
                    "view_history",
                )
            },
        ),
    )

    def product_name(self, obj):
        return obj.product.name

    product_name.short_description = "Product"
    product_name.admin_order_field = "product__name"

    def storage_location_name(self, obj):
        return obj.storagelocation.name

    storage_location_name.short_description = "Storage"
    storage_location_name.admin_order_field = "storagelocation__name"

    def stock_display(self, obj):
        kg_color = "red" if obj.stock_kg < 10 else "green"
        pieces_color = "red" if obj.stock_pieces < 10 else "green"

        # Convert to float explicitly before formatting
        kg_value = float(obj.stock_kg)
        pieces_value = float(obj.stock_pieces or 0)

        return format_html(
            '<span style="color: {};">{} kg</span> / '
            '<span style="color: {};">{} pcs</span>',
            kg_color,
            f"{kg_value:.3f}",
            pieces_color,
            f"{pieces_value:.0f}",
        )

    stock_display.short_description = "Stock"

    def availability_status(self, obj):
        if obj.is_out_of_stock():
            return format_html(
                '<span style="color: red; font-weight: bold;">Out of Stock</span>'
            )
        return format_html('<span style="color: green;">In Stock</span>')

    availability_status.short_description = "Status"

    def view_history(self, obj):
        if obj.pk:
            count = obj.history.count()
            return format_html(
                '<a href="/admin/inventory/inventoryhistory/?inventory__id__exact={}">'
                "View History ({} records)</a>",
                obj.pk,
                count,
            )
        return "-"

    view_history.short_description = "History"

    def save_model(self, request, obj, form, change):
        # Pass user to save method for history tracking
        super().save_model(request, obj, form, change)


# -------------------------------
# InventoryHistory Admin
# -------------------------------
@admin.register(InventoryHistory)
class InventoryHistoryAdmin(admin.ModelAdmin):
    list_display = [
        "created_at",
        "product_name",
        "storage_location_name",
        "action_type",
        "stock_change_display",
        "updated_by_user",
    ]

    list_filter = [
        "action_type",
        "created_at",
        "storage_location",
        "product__category",
    ]

    search_fields = [
        "product__name",
        "updated_by__username",
        "updated_by__email",
        "notes",
    ]

    readonly_fields = [
        "inventory",
        "product",
        "storage_location",
        "updated_by",
        "stock_kg_before",
        "stock_kg_after",
        "stock_pieces_before",
        "stock_pieces_after",
        "wholesale_price",
        "regular_price",
        "display_price",
        "bargain_price",
        "min_price",
        "action_type",
        "changes",
        "created_at",
        "stock_kg_change",
        "stock_pieces_change",
    ]

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "created_at",
                    "inventory",
                    "product",
                    "storage_location",
                    "updated_by",
                    "action_type",
                )
            },
        ),
        (
            "Stock Changes",
            {
                "fields": (
                    ("stock_kg_before", "stock_kg_after", "stock_kg_change"),
                    (
                        "stock_pieces_before",
                        "stock_pieces_after",
                        "stock_pieces_change",
                    ),
                )
            },
        ),
        (
            "Prices at Time of Update",
            {
                "fields": (
                    "wholesale_price",
                    "regular_price",
                    "display_price",
                    "bargain_price",
                    "min_price",
                )
            },
        ),
        (
            "Additional Details",
            {
                "fields": (
                    "notes",
                    "changes",
                )
            },
        ),
    )

    def has_add_permission(self, request):
        """Disable manual addition of history records"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Disable deletion of history records"""
        return True

    def product_name(self, obj):
        return obj.product.name

    product_name.short_description = "Product"
    product_name.admin_order_field = "product__name"

    def storage_location_name(self, obj):
        return obj.storage_location.name

    storage_location_name.short_description = "Storage"
    storage_location_name.admin_order_field = "storage_location__name"

    def stock_change_display(self, obj):
        kg_change = float(obj.stock_kg_change)
        pieces_change = float(obj.stock_pieces_change)

        kg_color = "green" if kg_change >= 0 else "red"
        pieces_color = "green" if pieces_change >= 0 else "red"

        kg_sign = "+" if kg_change >= 0 else ""
        pieces_sign = "+" if pieces_change >= 0 else ""

        return format_html(
            '<span style="color: {};">{}{} kg</span> / '
            '<span style="color: {};">{}{} pcs</span>',
            kg_color,
            kg_sign,
            f"{kg_change:.3f}",
            pieces_color,
            pieces_sign,
            f"{pieces_change:.0f}",
        )

    stock_change_display.short_description = "Stock Change"

    def updated_by_user(self, obj):
        if obj.updated_by:
            return obj.updated_by
        return "System"

    updated_by_user.short_description = "Updated By"
