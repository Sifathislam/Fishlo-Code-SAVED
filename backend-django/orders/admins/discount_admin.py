from django.contrib import admin
from django import forms
from django.utils.html import format_html

from ..models.discount_model import Discount

# ==================
# DISCOUNT ADMIN
# ==================

class DiscountAdminForm(forms.ModelForm):
    class Meta:
        model = Discount
        fields = '__all__'
        widgets = {
            'code': forms.TextInput(attrs={
                'style': 'text-transform: uppercase;', # Makes it look uppercase
                'oninput': 'this.value = this.value.toUpperCase()', # Makes it actually uppercase
            }),
        }

@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    form = DiscountAdminForm
    list_display = (
        "code",
        "discount_type",
        'discount_source',
        "discount_value_display",
        "usage_info",
        "validity_status",
        "is_active",
        "created_at",
    )
    list_filter = ("discount_type", "is_active", "created_at", "valid_from", "valid_to")
    search_fields = ("code",)
    readonly_fields = ("created_at", "updated_at", "used_count", "validity_status")
    date_hierarchy = "created_at"

    fieldsets = (
        (
            "Discount Code",
            {
                "fields": (
                    "code",
                    "discount_type",
                    "discount_source",
                    "discount_fixed_amount",
                    "discount_percentage",
                    "is_active",
                )
            },
        ),
        ("Conditions", {"fields": ("min_order_amount", "max_discount")}),
        ("Validity Period", {"fields": ("valid_from", "valid_to", "validity_status")}),
        ("Usage Limits", {"fields": ("usage_limit", "used_count")}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def discount_value_display(self, obj):
        if obj.discount_type == "PERCENTAGE":
            return f"{obj.discount_percentage}%"
        return f"₹{obj.discount_fixed_amount:.2f}"

    discount_value_display.short_description = "Discount Value"
    discount_value_display.admin_order_field = "discount_value"

    def usage_info(self, obj):
        if obj.usage_limit:
            percentage = (obj.used_count / obj.usage_limit) * 100
            color = (
                "#28a745"
                if percentage < 80
                else "#f0ad4e" if percentage < 100 else "#d9534f"
            )
            return format_html(
                '<span style="color: {};">{} / {}</span>',
                color,
                obj.used_count,
                obj.usage_limit,
            )
        return format_html(
            '<span style="color: #999;">{} (unlimited)</span>', obj.used_count
        )

    usage_info.short_description = "Usage"

    def validity_status(self, obj):
        is_valid, message = obj.is_valid()
        if is_valid:
            return format_html(
                '<span style="color: #28a745; font-weight: bold;">✓ Valid</span>'
            )
        return format_html(
            '<span style="color: #d9534f; font-weight: bold;">✗ {}</span>', message
        )

    validity_status.short_description = "Status"

    actions = ["activate_discounts", "deactivate_discounts"]

    def activate_discounts(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} discount(s) activated.")

    activate_discounts.short_description = "Activate selected discounts"

    def deactivate_discounts(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} discount(s) deactivated.")

    deactivate_discounts.short_description = "Deactivate selected discounts"

