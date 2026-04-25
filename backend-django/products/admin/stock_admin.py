from django.contrib import admin
from django.utils.html import format_html

from ..models import RecentlyViewed, StockNotifyRequest


# ------------------------------
# STOCK NOTIFY REQUEST ADMIN
# -------------------------------
@admin.register(StockNotifyRequest)
class StockNotifyRequestAdmin(admin.ModelAdmin):
    list_display = ("user", "product", "product_availability", "created_at")
    list_filter = ("created_at", "product__is_available")
    search_fields = ("user__phone_number", "product__name")
    readonly_fields = ("user", "product", "created_at")
    autocomplete_fields = ["user", "product"]
    date_hierarchy = "created_at"

    fieldsets = (
        ("Request Information", {"fields": ("user", "product")}),
        ("Metadata", {"fields": ("created_at",), "classes": ("collapse",)}),
    )

    def product_availability(self, obj):
        if obj.product.is_available:
            return format_html('<span style="color: green;">✓ Available</span>')
        return format_html('<span style="color: red;">✗ Out of Stock</span>')

    product_availability.short_description = "Status"

    actions = ["notify_users"]

    def notify_users(self, request, queryset):
        # Placeholder for notification logic
        count = queryset.count()
        self.message_user(
            request, f"{count} user(s) will be notified (implement notification logic)."
        )

    notify_users.short_description = "Notify selected users about stock availability"

    def has_add_permission(self, request):
        # Users create requests from frontend, not admin
        return False


@admin.register(RecentlyViewed)
class RecentlyViewedAdmin(admin.ModelAdmin):
    list_display = ["product", "user", "viewed_at"]
    list_filter = ["viewed_at"]
    search_fields = ["product__name", "user__email"]
    readonly_fields = ["viewed_at"]
    date_hierarchy = "viewed_at"

    def has_add_permission(self, request):
        return False
