# admin.py
from django.contrib import admin
from django.utils.html import format_html
from ..models.receipt_share_model import ReceiptShareLink


@admin.action(description="Mark selected links as active")
def make_active(modeladmin, request, queryset):
    queryset.update(is_active=True)


@admin.action(description="Mark selected links as inactive")
def make_inactive(modeladmin, request, queryset):
    queryset.update(is_active=False)


@admin.register(ReceiptShareLink)
class ReceiptShareLinkAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order",
        "phone",
        "short_code",
        "receipt_pdf_link",
        "is_active",
        "click_count",
        "expires_at",
        "created_at",
    )
    list_filter = (
        "is_active",
        "created_at",
        "expires_at",
        "last_clicked_at",
    )
    search_fields = (
        "short_code",
        "phone",
        "order__order_number",
        "order__customer_name",
        "order__customer_phone",
    )
    readonly_fields = (
        "short_code",
        "click_count",
        "created_at",
        "last_clicked_at",
        "receipt_pdf_link",
    )
    ordering = ("-created_at",)
    list_per_page = 25
    actions = [make_active, make_inactive]

    fieldsets = (
        ("Receipt Info", {
            "fields": (
                "order",
                "receipt_file",
                "receipt_pdf_link",
                "phone",
                "short_code",
            )
        }),
        ("Status", {
            "fields": (
                "is_active",
                "click_count",
                "expires_at",
                "last_clicked_at",
            )
        }),
        ("Timestamps", {
            "fields": (
                "created_at",
            )
        }),
    )

    def receipt_pdf_link(self, obj):
        if obj.receipt_file:
            return format_html('<a href="{}" target="_blank">Open PDF</a>', obj.receipt_file.url)
        return "No PDF"

    receipt_pdf_link.short_description = "Receipt PDF"