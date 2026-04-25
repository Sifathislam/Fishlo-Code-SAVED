from django.contrib import admin
from django.utils.html import format_html

from ..models import Refund


# ---------------
# REFUND ADMIN
# ---------------
@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "order_link",
        "payment_link",
        "amount_display",
        "status_badge",
        "reason",
        "processed_by",
        "created_at",
        "processed_at",
    ]
    list_filter = ["status", "reason", "created_at", "processed_at"]
    search_fields = [
        "gateway_refund_id",
        "order__order_number",
        "payment__gateway_payment_id",
        "user__phone_number",
    ]
    readonly_fields = [
        "payment",
        "order",
        "user",
        "created_at",
        "updated_at",
        "processed_at",
        "gateway_response_display",
    ]
    list_per_page = 50
    date_hierarchy = "created_at"

    fieldsets = (
        ("Basic Info", {"fields": ("payment", "order", "user", "status")}),
        ("Refund Details", {"fields": ("amount", "reason", "reason_description")}),
        (
            "Gateway Details",
            {"fields": ("gateway_refund_id", "gateway_response_display")},
        ),
        ("Processing", {"fields": ("processed_by", "processed_at")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    def order_link(self, obj):
        if obj.order:
            url = f"/admin/orders/order/{obj.order.id}/change/"
            return format_html('<a href="{}">{}</a>', url, obj.order.order_number)
        return "-"

    order_link.short_description = "Order"

    def payment_link(self, obj):
        if obj.payment:
            url = f"/admin/payments/payment/{obj.payment.id}/change/"
            return format_html(
                '<a href="{}">{}</a>',
                url,
                obj.payment.gateway_payment_id or f"#{obj.payment.id}",
            )
        return "-"

    payment_link.short_description = "Payment"

    def amount_display(self, obj):
        return f"₹{obj.amount}"

    amount_display.short_description = "Amount"
    amount_display.admin_order_field = "amount"

    def status_badge(self, obj):
        colors = {
            "SUCCESS": "#28a745",
            "PENDING": "#ffc107",
            "PROCESSING": "#17a2b8",
            "FAILED": "#dc3545",
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
        return True

    def save_model(self, request, obj, form, change):
        if not obj.processed_by:
            obj.processed_by = request.user
        super().save_model(request, obj, form, change)
