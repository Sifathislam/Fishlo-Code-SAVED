# orders/utils/email_service.py
"""
Fishlo – Admin Order Notification Email Service
================================================
Fires a single email to the admin (Rathan Kumar) every time
a new order is successfully placed. No customer CC.

settings.py additions required
-------------------------------
EMAIL_BACKEND       = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST          = 'smtp.gmail.com'
EMAIL_PORT          = 587
EMAIL_USE_TLS       = True
EMAIL_HOST_USER     = env('EMAIL_HOST_USER')        # sender Gmail
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD')    # Gmail App Password
DEFAULT_FROM_EMAIL  = 'Fishlo Orders <your@gmail.com>'

ADMIN_ORDER_NOTIFICATION_EMAIL = 'Rathan Kumar <developer.rathan@gmail.com>'
ADMIN_PANEL_BASE_URL = 'https://admin.fishlo.in'
"""

import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from orders.utils.number_data_formater import format_amount,format_weight
from django.template.exceptions import TemplateDoesNotExist

ADMIN_EMAIL = getattr(
    settings,
    "ADMIN_ORDER_NOTIFICATION_EMAIL",
    "Sifat Islam <sifathislam790@gmail.com>",
)


def _build_admin_context(order) -> dict:
    customer_name  = "N/A"
    customer_email = "N/A"
    customer_phone = "N/A"
    full_address   = "N/A"

    try:
        addr = order.order_address
        customer_name  = addr.full_name or ""
        customer_phone = addr.phone or ""
        customer_email = addr.email or (order.user.email if order.user else "N/A")
        full_address   = addr.get_full_address()
    except Exception:
        if order.user:
            customer_name  = order.user.get_full_name() or order.user.email
            customer_email = order.user.email

    items_data = []
    try:
        for item in order.order_items.prefetch_related("selected_cuts").all():
            cuts_str = ", ".join(c.name for c in item.selected_cuts.all())
            items_data.append({
                "product_name":  item.product_name,
                "sell_type":     item.sell_type,
                "quantity":      item.quantity,
                "weight":        format_weight(item.weight, item.product, item.quantity),
                "pieces":        item.pieces,
                "subtotal":      format_amount(item.subtotal),
                "selected_cuts": cuts_str,
            })
    except Exception:
        pass

    pm_display = {
        "Razorpay":        "Online – Razorpay",
        "UPI_ON_DELIVERY": "UPI on Delivery",
        "UPI_ONLINE":      "UPI Online",
        "CASH":            "Cash on Delivery",
        "COD":             "Cash On Delivery",
    }.get(order.payment_method, order.payment_method)

    storage_location = "N/A"
    try:
        if order.storage_location:
            storage_location = order.storage_location.name
    except Exception:
        pass

    base = getattr(settings, "ADMIN_PANEL_BASE_URL", "https://fishlo.in/admin/")
    admin_url = f"{base}/orders/order/{order.id}/change/"

    return {
        "order_number":     order.order_number,
        "token_number":     order.token_number or "—",
        "order_date":       timezone.localtime(order.created_at).strftime("%d %b %Y, %I:%M %p"),
        "order_source":     order.source,
        "payment_method":   pm_display,
        "payment_status":   order.payment_status,
        "transaction_id":   order.transaction_id or "",
        "customer_name":    customer_name,
        "customer_email":   customer_email,
        "customer_phone":   customer_phone,
        "full_address":     full_address,
        "order_items":      items_data,
        "subtotal":         format_amount(order.subtotal),
        "delivery_charge":  format_amount(order.delivery_charge),
        "discount_code":    order.discount_code or "",
        "discount_amount":  format_amount(order.discount_amount),
        "vat_percentage":   order.vat_percentage,
        "vat_amount":       format_amount(order.vat_amount),
        "total_amount":     format_amount(order.total_amount),
        "partial_pay":      format_amount(order.partial_pay),
        "remaining_amount": format_amount(order.remaining_amount),
        "delivery_date":    order.get_delivery_day_display() if hasattr(order, "get_delivery_day_display") else "",
        "delivery_slot":    order.delivery_slot_label or "—",
        "storage_location": storage_location,
        "admin_order_url":  admin_url,
    }

def notify_admin_new_order(order) -> bool:
    """
    Send admin-only notification email for a new order.
    Never raises — logs errors instead.
    """
    try:
        context    = _build_admin_context(order)
        try:
            html_body = render_to_string("emails/admin_order_notification.html", context)
        except TemplateDoesNotExist as e:
            print("TEMPLATE NOT FOUND:", e)   # ← this will tell you exactly what's wrong
            return False
        plain_body = strip_tags(html_body)

        subject = (
            f"🛎️ New Order #{order.order_number} "
            f"| ₹{format_amount(order.total_amount)} | {context['payment_method']} | Fishlo"
        )

        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[ADMIN_EMAIL],   # admin ONLY
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)

        print("[Fishlo] Admin order email sent | order=%s", order.order_number)
        return True

    except Exception as exc:
        print(exc)
        print(
            "[Fishlo] Admin order email FAILED | order=%s | error=%s",
            getattr(order, "order_number", "N/A"),
        )
        return False


# Optional Celery wrapper
def notify_admin_new_order_async(order_id: int) -> None:
    from orders.models.orders_models import Order
    try:
        order = Order.objects.select_related(
            "user", "order_address", "storage_location"
        ).get(pk=order_id)
        notify_admin_new_order(order)
    except Order.DoesNotExist:
        print("[Fishlo] Order %s not found for admin email.", order_id)