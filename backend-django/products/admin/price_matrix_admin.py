from django.contrib import admin
from django.utils.html import format_html

from ..models import PriceMatrix


@admin.register(PriceMatrix)
class PriceMatrixAdmin(admin.ModelAdmin):
    list_display = (
        "product",
        "storage_location",
        "price_ladder",
        "validity_period",
        "status_badge",
        "created_at",
    )

    list_filter = (
        "is_active",
        "storage_location",
        "created_at",
    )

    search_fields = (
        "product__name",
        "storage_location__name",
    )

    autocomplete_fields = (
        "product",
        "storage_location",
    )

    readonly_fields = (
        "created_at",
    )

    list_select_related = (
        "product",
        "storage_location",
    )

    fieldsets = (
        (
            "Product & Location",
            {
                "fields": (
                    "product",
                    "storage_location",
                )
            },
        ),
        (
            "Pricing",
            {
                "fields": (
                    "min_price",
                    "bargain_price",
                    "display_price",
                    "regular_price",
                    "wholesale_price",
                )
            },
        ),
        (
            "Validity",
            {
                "fields": (
                    "valid_from",
                    "valid_to",
                    "is_active",
                )
            },
        ),
        (
            "Metadata",
            {
                "fields": ("created_at",),
                "classes": ("collapse",),
            },
        ),
    )

    actions = [
        "activate_prices",
        "deactivate_prices",
    ]

    # -----------------------------
    # Display Helpers
    # -----------------------------

    def price_ladder(self, obj):
        return format_html(
            """
            <b>Min:</b> ₹{} <br>
            <b>Bargain:</b> ₹{} <br>
            <b>Display:</b> ₹{} <br>
            <b>Regular:</b> ₹{} <br>
            <b>Wholesale:</b> ₹{}
            """,
            f"{obj.min_price:.2f}",
            f"{obj.bargain_price:.2f}",
            f"{obj.display_price:.2f}",
            f"{obj.regular_price:.2f}",
            f"{obj.wholesale_price:.2f}",
        )

    price_ladder.short_description = "Price Ladder"

    def validity_period(self, obj):
        if obj.valid_from or obj.valid_to:
            return f"{obj.valid_from or '—'} → {obj.valid_to or '—'}"
        return "Always"

    validity_period.short_description = "Validity"

    def status_badge(self, obj):
        if obj.is_active:
            return format_html(
                '<span style="color: green; font-weight: bold;">ACTIVE</span>'
            )
        return format_html(
            '<span style="color: red; font-weight: bold;">INACTIVE</span>'
        )

    status_badge.short_description = "Status"

    # -----------------------------
    # Bulk Actions
    # -----------------------------

    def activate_prices(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} price matrix record(s) activated.")

    activate_prices.short_description = "Activate selected prices"

    def deactivate_prices(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} price matrix record(s) deactivated.")

    deactivate_prices.short_description = "Deactivate selected prices"
