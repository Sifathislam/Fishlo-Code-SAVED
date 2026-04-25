
from django.contrib import admin
from django.utils.html import format_html

from ..models.tax_models import TaxConfiguration

# ---------------
# TAX CONFIGURATION ADMIN
# ---------------
@admin.register(TaxConfiguration)
class TaxConfigurationAdmin(admin.ModelAdmin):
    list_display = [
        "tax_type",
        "tax_percentage_display",
        "is_active_badge",
        "is_inclusive_badge",
        "updated_at",
        "updated_by",
    ]

    fieldsets = (
        (
            "Tax Settings",
            {"fields": ("tax_type", "tax_percentage", "is_active", "is_inclusive")},
        ),
        (
            "Metadata",
            {"fields": ("updated_at", "updated_by"), "classes": ("collapse",)},
        ),
    )

    readonly_fields = ["updated_at", "updated_by"]

    def tax_percentage_display(self, obj):
        return f"{obj.tax_percentage}%"

    tax_percentage_display.short_description = "Tax Rate"

    def is_active_badge(self, obj):
        if obj.is_active:
            return format_html(
                '<span style="background:#28a745; color:white; padding:3px 10px; border-radius:3px;">Active</span>'
            )
        return format_html(
            '<span style="background:#dc3545; color:white; padding:3px 10px; border-radius:3px;">Inactive</span>'
        )

    is_active_badge.short_description = "Status"

    def is_inclusive_badge(self, obj):
        if obj.is_inclusive:
            return format_html(
                '<span style="background:#17a2b8; color:white; padding:3px 8px; border-radius:3px;">Inclusive</span>'
            )
        return format_html(
            '<span style="background:#ffc107; color:black; padding:3px 8px; border-radius:3px;">Exclusive</span>'
        )

    is_inclusive_badge.short_description = "Tax Type"

    def has_add_permission(self, request):
        # Only allow one configuration
        return not TaxConfiguration.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
