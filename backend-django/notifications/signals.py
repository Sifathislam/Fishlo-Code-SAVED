"""
signals.py
----------
Django signals that automatically fire notifications when things happen
in your app — without you having to manually call anything.

How it works:
  - You save an Order → signal fires → notification queued automatically
  - You update a Payment → signal fires → notification queued automatically

Setup: these signals are connected in apps.py ready() method.

IMPORTANT: Adapt the model imports at the top to match YOUR actual
model names and field names in Fishlo.
"""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# HELPER: Check quiet hours before sending
# ─────────────────────────────────────────────────────────────

def _is_quiet_hours(user) -> bool:
    """
    Returns True if current time is within the user's quiet hours.
    If no preference set, quiet hours are not active.
    """
    from .models import NotificationPreference

    try:
        pref = NotificationPreference.objects.get(user=user)
        if not pref.quiet_hours_start or not pref.quiet_hours_end:
            return False

        now_time = timezone.localtime(timezone.now()).time()
        start = pref.quiet_hours_start
        end = pref.quiet_hours_end

        # Handle overnight quiet hours e.g. 22:00 → 08:00
        if start > end:
            return now_time >= start or now_time <= end
        else:
            return start <= now_time <= end

    except NotificationPreference.DoesNotExist:
        return False


def _queue_notification(user, title, body, category, notification_type, data=None):
    """
    Safe wrapper around send_transactional_notification.
    Respects quiet hours — if quiet hours active, skips sending.
    Catches all exceptions so a notification failure never breaks your app.
    """
    try:
        if _is_quiet_hours(user):
            logger.info(
                f"Quiet hours active for user #{user.id}. "
                f"Skipping {notification_type}."
            )
            return

        # from .tasks import send_transactional_notification
        # send_transactional_notification(
        #     user_id=user.id,
        #     title=title,
        #     body=body,
        #     category=category,
        #     notification_type=notification_type,
        #     data=data or {},
        # )
    except Exception as e:
        # NEVER let a notification error crash your main app flow
        logger.error(
            f"Failed to queue notification ({notification_type}) "
            f"for user #{user.id}: {e}"
        )


# ─────────────────────────────────────────────────────────────
# ORDER SIGNALS
# Adapt 'yourapp.Order' to your actual app name
# ─────────────────────────────────────────────────────────────

# We connect signals manually in apps.py to avoid circular imports.
# The functions below are called directly from apps.py ready()

def handle_order_status_change(sender, instance, created, **kwargs):
    """
    Fires when an Order is saved.
    Sends different notifications based on the order status.

    Expected Order fields (adapt to your model):
        instance.user       → the customer
        instance.id         → order ID
        instance.status     → e.g. 'confirmed', 'cancelled', 'delivered'
        instance.total      → order total amount
    """
    # Skip if no user on order
    if not hasattr(instance, 'user') or not instance.user:
        return

    user = instance.user
    order_id = instance.id

    # ── New order created ──
    if created:
        _queue_notification(
            user=user,
            title="Order Placed! 🛒",
            body=f"Your order #{order_id} has been placed successfully.",
            category="ORDER",
            notification_type="ORDER_CONFIRMED",
            data={
                "order_id": str(order_id),
                "deep_link": f"fishlo://order/{order_id}",
            }
        )
        return

    # ── Status changes (only on update, not create) ──
    status = getattr(instance, 'status', None)
    if not status:
        return

    # Map order status → notification content
    status_map = {
        'confirmed': {
            'title': 'Order Confirmed ✅',
            'body': f'Your order #{order_id} has been confirmed.',
            'notification_type': 'ORDER_CONFIRMED',
        },
        'cancelled': {
            'title': 'Order Cancelled ❌',
            'body': f'Your order #{order_id} has been cancelled.',
            'notification_type': 'ORDER_CANCELLED',
        },
        'out_for_delivery': {
            'title': 'Out for Delivery 🚚',
            'body': f'Your order #{order_id} is on the way!',
            'notification_type': 'OUT_FOR_DELIVERY',
        },
        'delivered': {
            'title': 'Order Delivered! 🎉',
            'body': f'Your order #{order_id} has been delivered.',
            'notification_type': 'DELIVERED',
        },
    }

    notif_data = status_map.get(status)
    if notif_data:
        _queue_notification(
            user=user,
            title=notif_data['title'],
            body=notif_data['body'],
            category="ORDER",
            notification_type=notif_data['notification_type'],
            data={
                "order_id": str(order_id),
                "status": status,
                "deep_link": f"fishlo://order/{order_id}",
            }
        )


def handle_payment_status_change(sender, instance, created, **kwargs):
    """
    Fires when a Payment is saved.

    Expected Payment fields (adapt to your model):
        instance.user        → the customer
        instance.id          → payment ID
        instance.status      → e.g. 'success', 'failed'
        instance.amount      → payment amount
        instance.order_id    → related order (optional)
    """
    if not hasattr(instance, 'user') or not instance.user:
        return

    user = instance.user
    payment_id = instance.id
    amount = getattr(instance, 'amount', '')
    status = getattr(instance, 'status', None)

    if not status:
        return

    if status == 'success':
        _queue_notification(
            user=user,
            title='Payment Successful ✅',
            body=f'Your payment of ৳{amount} was successful.',
            category='PAYMENT',
            notification_type='PAYMENT_SUCCESS',
            data={
                "payment_id": str(payment_id),
                "amount": str(amount),
                "deep_link": f"fishlo://payment/{payment_id}",
            }
        )

    elif status == 'failed':
        _queue_notification(
            user=user,
            title='Payment Failed ❌',
            body=f'Your payment of ৳{amount} could not be processed. Please try again.',
            category='PAYMENT',
            notification_type='PAYMENT_FAILED',
            data={
                "payment_id": str(payment_id),
                "amount": str(amount),
                "deep_link": f"fishlo://payment/{payment_id}/retry",
            }
        )


def handle_bargain_update(sender, instance, created, **kwargs):
    """
    Fires when a Bargain/Offer is updated.
    Adapt field names to your Bargain model.
    """
    if not hasattr(instance, 'user') or not instance.user:
        return

    user = instance.user
    status = getattr(instance, 'status', None)

    if status == 'accepted':
        _queue_notification(
            user=user,
            title='Bargain Accepted! 🤝',
            body='Your bargain offer has been accepted.',
            category='BARGAIN',
            notification_type='BARGAIN_UPDATE',
            data={
                "bargain_id": str(instance.id),
                "deep_link": f"fishlo://bargain/{instance.id}",
            }
        )
    elif status == 'rejected':
        _queue_notification(
            user=user,
            title='Bargain Declined',
            body='Your bargain offer was not accepted. Try a different price.',
            category='BARGAIN',
            notification_type='BARGAIN_UPDATE',
            data={
                "bargain_id": str(instance.id),
                "deep_link": f"fishlo://bargain/{instance.id}",
            }
        )
