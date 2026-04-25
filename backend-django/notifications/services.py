"""
services.py
-----------
Core business logic for sending notifications via Firebase.

Flow:
  1. Django creates a Notification record
  2. Celery task calls send_notification_to_user()
  3. This service fetches user's active devices
  4. Sends via Firebase in batches of 500 (Firebase limit)
  5. Saves delivery result per device in NotificationDelivery
  6. Logs every step in NotificationEvent

Key design choices for MVP:
  - Batch sending (500 tokens per call) for performance
  - Auto-deactivates invalid/expired FCM tokens
  - Respects user's NotificationPreference settings
  - Full audit trail via NotificationEvent
"""

import logging
from datetime import datetime
from typing import Optional

from django.utils import timezone
from firebase_admin import messaging

from .firebase import get_firebase_app
from .models import (
    Device,
    Notification,
    NotificationDelivery,
    NotificationEvent,
    NotificationPreference,
)


# Firebase allows max 500 tokens per multicast call
FIREBASE_BATCH_SIZE = 500


# ─────────────────────────────────────────────────────────────
# PUBLIC: Main entry point — called by Celery tasks
# ─────────────────────────────────────────────────────────────

def send_notification_to_user(notification_id: int) -> dict:
    """
    Send a notification to all active devices of a user.

    Args:
        notification_id: PK of the Notification record

    Returns:
        dict with sent_count and failed_count
    """
    # ── Step 1: Load the notification ──
    try:
        notification = Notification.objects.select_related('user').get(id=notification_id)
    except Notification.DoesNotExist:
        return {'sent_count': 0, 'failed_count': 0}

    # ── Step 2: Check user's notification preferences ──
    if not _is_notification_allowed(notification):

        _log_event(notification, NotificationEvent.EventType.FAILED, {
            'reason': 'blocked_by_user_preference',
            'category': notification.category,
        })
        return {'sent_count': 0, 'failed_count': 0}

    # ── Step 3: Get all active device tokens for this user ──
    devices = Device.objects.filter(
        user=notification.user,
        is_active=True
    ).values('id', 'fcm_token')

    if not devices:
        notification.status = Notification.Status.FAILED
        notification.save(update_fields=['status'])
        _log_event(notification, NotificationEvent.EventType.FAILED, {
            'reason': 'no_active_devices'
        })
        return {'sent_count': 0, 'failed_count': 0}

    # ── Step 4: Update status to QUEUED ──
    notification.status = Notification.Status.QUEUED
    notification.save(update_fields=['status'])
    _log_event(notification, NotificationEvent.EventType.QUEUED)

    # ── Step 5: Send in batches ──
    device_list = list(devices)
    total_sent = 0
    total_failed = 0

    # Split into chunks of FIREBASE_BATCH_SIZE
    for batch_start in range(0, len(device_list), FIREBASE_BATCH_SIZE):
        batch = device_list[batch_start: batch_start + FIREBASE_BATCH_SIZE]
        sent, failed = _send_batch(notification, batch)
        total_sent += sent
        total_failed += failed

    # ── Step 6: Update final status ──
    final_status = Notification.Status.SENT if total_sent > 0 else Notification.Status.FAILED
    notification.status = final_status
    notification.sent_at = timezone.now()
    notification.save(update_fields=['status', 'sent_at'])

    _log_event(notification, NotificationEvent.EventType.SENT, {
        'total_sent': total_sent,
        'total_failed': total_failed,
    })


    return {'sent_count': total_sent, 'failed_count': total_failed}


# ─────────────────────────────────────────────────────────────
# PRIVATE: Send a batch of tokens (max 500)
# ─────────────────────────────────────────────────────────────

def _send_batch(notification: Notification, devices: list) -> tuple[int, int]:
    """
    Send notification to a batch of devices using Firebase multicast.

    Args:
        notification: Notification model instance
        devices: List of dicts with 'id' and 'fcm_token'

    Returns:
        (sent_count, failed_count)
    """
    from django.conf import settings

    # ── Dev mode: skip real Firebase call ──
    if getattr(settings, 'NOTIFICATIONS_SKIP_FIREBASE', False):

        NotificationDelivery.objects.bulk_create([
            NotificationDelivery(
                notification=notification,
                device_id=d['id'],
                fcm_message_id=f'dev_mock_{d["id"]}',
                delivery_status=NotificationDelivery.DeliveryStatus.SENT,
                delivered_at=timezone.now(),
            )
            for d in devices
        ])
        return len(devices), 0  # all "sent"
    get_firebase_app()  # Ensure Firebase is initialized

    tokens = [d['fcm_token'] for d in devices]
    device_id_map = {d['fcm_token']: d['id'] for d in devices}

    # Build the Firebase multicast message
    fcm_message = messaging.MulticastMessage(
        tokens=tokens,
        notification=messaging.Notification(
            title=notification.title,
            body=notification.body,
        ),
        # data must be string → string
        data={
            'notification_id': str(notification.id),
            'category': notification.category,
            'notification_type': notification.notification_type,
            **{k: str(v) for k, v in notification.data_json.items()},
        },
        android=messaging.AndroidConfig(
            priority='high',
            notification=messaging.AndroidNotification(
                sound='default',
                click_action='FLUTTER_NOTIFICATION_CLICK',  # standard for Flutter apps
            ),
        ),
        apns=messaging.APNSConfig(
            payload=messaging.APNSPayload(
                aps=messaging.Aps(sound='default'),
            ),
        ),
    )

    # Send to Firebase
    try:
        batch_response = messaging.send_each_for_multicast(fcm_message)
    except Exception as e:
        # Mark all as failed
        _save_delivery_results_all_failed(notification, devices, str(e))
        return 0, len(devices)

    # Process per-token responses
    sent_count = 0
    failed_count = 0
    invalid_tokens = []

    for i, response in enumerate(batch_response.responses):
        token = tokens[i]
        device_id = device_id_map[token]

        if response.success:
            sent_count += 1
            NotificationDelivery.objects.create(
                notification=notification,
                device_id=device_id,
                fcm_message_id=response.message_id,
                delivery_status=NotificationDelivery.DeliveryStatus.SENT,
                delivered_at=timezone.now(),
            )
        else:
            failed_count += 1
            error_code = response.exception.code if response.exception else 'unknown'
            error_msg = str(response.exception) if response.exception else 'Unknown error'

            # Detect invalid/expired tokens
            is_invalid_token = error_code in (
                'registration-token-not-registered',
                'invalid-registration-token',
                'invalid-argument',
            )

            delivery_status = (
                NotificationDelivery.DeliveryStatus.INVALID_TOKEN
                if is_invalid_token
                else NotificationDelivery.DeliveryStatus.FAILED
            )

            NotificationDelivery.objects.create(
                notification=notification,
                device_id=device_id,
                delivery_status=delivery_status,
                error_message=error_msg,
            )

            if is_invalid_token:
                invalid_tokens.append(token)


    # Deactivate invalid tokens so we don't waste API calls next time
    if invalid_tokens:
        _deactivate_invalid_tokens(invalid_tokens)

    return sent_count, failed_count


# ─────────────────────────────────────────────────────────────
# PRIVATE: Helper utilities
# ─────────────────────────────────────────────────────────────

def _is_notification_allowed(notification: Notification) -> bool:
    """
    Check if user has enabled this category of notification.
    Returns True if preference record doesn't exist (default = allow all).
    """
    try:
        pref = NotificationPreference.objects.get(user=notification.user)
        return pref.is_category_enabled(notification.category)
    except NotificationPreference.DoesNotExist:
        return True  # No preference set = allow everything


def _log_event(
    notification: Notification,
    event_type: str,
    event_data: dict = None
) -> None:
    """Create a NotificationEvent record for audit trail."""
    NotificationEvent.objects.create(
        notification=notification,
        event_type=event_type,
        event_data=event_data or {},
    )


def _deactivate_invalid_tokens(tokens: list) -> None:
    """
    Mark devices with invalid/expired FCM tokens as inactive.
    This prevents wasted API calls on future sends.
    """
    updated = Device.objects.filter(fcm_token__in=tokens).update(is_active=False)


def _save_delivery_results_all_failed(
    notification: Notification,
    devices: list,
    error_msg: str
) -> None:
    """Bulk-create FAILED delivery records when the entire batch call fails."""
    NotificationDelivery.objects.bulk_create([
        NotificationDelivery(
            notification=notification,
            device_id=d['id'],
            delivery_status=NotificationDelivery.DeliveryStatus.FAILED,
            error_message=error_msg,
        )
        for d in devices
    ])
