from django.contrib import admin
from django.utils.html import format_html

from ..models import Payment


# ---------------
# PAYMENT ADMIN
# ---------------
@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "order_link",
        "user_link",
        "payment_method",
        "amount_display",
        "status_badge",
        "gateway_payment_id",
        "paid_at",
        "created_at",
    ]
    list_filter = ["status", "payment_method", "created_at", "paid_at"]
    search_fields = [
        "gateway_payment_id",
        "gateway_order_id",
        "order__order_number",
        "user__phone_number",
        "user__email",
    ]
    readonly_fields = [
        "order",
        "user",
        "created_at",
        "updated_at",
        "paid_at",
        "gateway_response_display",
    ]
    list_per_page = 50
    date_hierarchy = "created_at"

    fieldsets = (
        ("Basic Info", {"fields": ("order", "user", "payment_method", "status")}),
        ("Amount", {"fields": ("amount", "currency")}),
        (
            "Gateway Details",
            {
                "fields": (
                    "gateway_payment_id",
                    "gateway_order_id",
                    "gateway_signature",
                    "gateway_response_display",
                )
            },
        ),
        ("Timestamps", {"fields": ("created_at", "updated_at", "paid_at")}),
        (
            "Additional Info",
            {"fields": ("failure_reason", "notes"), "classes": ("collapse",)},
        ),
    )

    def order_link(self, obj):
        if obj.order:
            url = f"/admin/orders/order/{obj.order.id}/change/"
            return format_html('<a href="{}">{}</a>', url, obj.order.order_number)
        return "-"

    order_link.short_description = "Order"

    def user_link(self, obj):
        if obj.user:
            url = f"/admin/accounts/user/{obj.user.id}/change/"
            return format_html('<a href="{}">{}</a>', url, str(obj.user))
        return "-"

    user_link.short_description = "User"

    def amount_display(self, obj):
        return f"₹{obj.amount}"

    amount_display.short_description = "Amount"
    amount_display.admin_order_field = "amount"

    def status_badge(self, obj):
        colors = {
            "SUCCESS": "#28a745",
            "PENDING": "#ffc107",
            "FAILED": "#dc3545",
            "REFUNDED": "#6c757d",
            "CANCELLED": "#6c757d",
        }
        color = colors.get(obj.status, "#6c757d")
        return format_html(
            '<span style="background:{}; color:white; padding:3px 10px; border-radius:3px; font-weight:bold;">{}</span>',
            color,
            obj.get_status_display(),
        )

    status_badge.short_description = "Status"

    def gateway_response_display(self, obj):
        if obj.gateway_response:
            import json

            formatted = json.dumps(obj.gateway_response, indent=2)
            return format_html(
                '<pre style="background:#f5f5f5; padding:10px;">{}</pre>', formatted
            )
        return "-"

    gateway_response_display.short_description = "Gateway Response"

    def has_add_permission(self, request):
        return False
