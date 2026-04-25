"""
tasks.py
--------
Celery tasks for async notification processing.

Why Celery?
  - Notifications should NOT block the API response
  - If Firebase is slow or down, the user's request still completes fast
  - Failed tasks can be retried automatically
  - Campaign sends (thousands of users) run in background

Task overview:
  1. send_notification_task        → sends one notification to one user
  2. send_campaign_task            → sends bulk campaign to many users
  3. send_transactional_notification → shortcut helper for code-triggered notifs
"""

import logging
from celery import shared_task
from django.utils import timezone

# ─────────────────────────────────────────────────────────────
# TASK 1: Send a single notification (transactional)
# ─────────────────────────────────────────────────────────────

# @shared_task(
#     bind=True,
#     max_retries=3,
#     default_retry_delay=60,  # retry after 60 seconds
#     name='notifications.send_notification_task',
# )
# def send_notification_task(self, notification_id: int):
#     """
#     Celery task to send a single notification.

#     Called after creating a Notification record.
#     Retries up to 3 times on failure.

#     Args:
#         notification_id: PK of the Notification record
#     """
#     from .services import send_notification_to_user


#     try:
#         result = send_notification_to_user(notification_id)

#         return result

#     except Exception as exc:
#         # Retry with exponential backoff: 60s, 120s, 240s
#         raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


# ─────────────────────────────────────────────────────────────
# TASK 2: Send campaign to all/many users
# ─────────────────────────────────────────────────────────────

@shared_task(
    bind=True,
    max_retries=1,
    name='notifications.send_campaign_task',
)
def send_campaign_task(self, campaign_id: int):
    """
    Celery task to process and send a campaign.

    Flow:
      1. Load campaign
      2. Get target audience devices
      3. Create Notification records for each user
      4. Send via Firebase batch
      5. Update CampaignLog with results

    Args:
        campaign_id: PK of the Campaign record
    """
    from .models import Campaign, CampaignLog, Notification, Device
    from .services import  send_notification_to_user

    # ── Load campaign ──
    try:
        campaign = Campaign.objects.get(id=campaign_id)
    except Campaign.DoesNotExist:
        return

    # ── Update status to SENDING ──
    campaign.status = Campaign.Status.SENDING
    campaign.save(update_fields=['status'])

    # Create log entry
    log = CampaignLog.objects.create(
        campaign=campaign,
        started_at=timezone.now(),
    )

    total_targeted = 0
    total_sent = 0
    total_failed = 0

    try:
        # ── Handle ALL users (send to every active device user) ──
        if campaign.audience_type == Campaign.AudienceType.ALL:
            # Get all unique users with active devices
            from django.contrib.auth import get_user_model
            User = get_user_model()

            user_ids = Device.objects.filter(
                is_active=True
            ).values_list('user_id', flat=True).distinct()

            total_targeted = len(user_ids)

            for user_id in user_ids:
                if user_id is None:
                    continue  # skip guest devices for campaigns

                try:
                    # Create a Notification record for this user
                    notif = Notification.objects.create(
                        user_id=user_id,
                        title=campaign.title,
                        body=campaign.body,
                        category=Notification.Category.PROMO,
                        notification_type=Notification.NotificationType.PROMO_OFFER,
                        data_json={
                            'campaign_id': str(campaign.id),
                            'deep_link': campaign.deep_link or '',
                            **(campaign.data_json or {}),
                        },
                        status=Notification.Status.CREATED,
                    )

                    # Send synchronously within this task
                    # (we're already async in Celery)
                    result = send_notification_to_user(notif.id)
                    print("result ====>",result)
                    total_sent += result['sent_count']
                    total_failed += result['failed_count']

                except Exception as e:
                    total_failed += 1

        # ── Update campaign stats ──
        # campaign.status = Campaign.Status.COMPLETED
        campaign.sent_count = total_sent
        campaign.failed_count = total_failed
        campaign.save(update_fields=['status', 'sent_count', 'failed_count'])

        # ── Update log ──
        log.total_targeted = total_targeted
        log.total_sent = total_sent
        log.total_failed = total_failed
        log.completed_at = timezone.now()
        log.save()


    except Exception as exc:
        campaign.status = Campaign.Status.FAILED
        campaign.save(update_fields=['status'])
        log.completed_at = timezone.now()
        log.save()
        raise self.retry(exc=exc)


# ─────────────────────────────────────────────────────────────
# HELPER: Shortcut to create + queue a transactional notification
# ─────────────────────────────────────────────────────────────

# def send_transactional_notification(
#     user_id: int,
#     title: str,
#     body: str,
#     category: str,
#     notification_type: str,
#     data: dict = None,
# ) -> int:
#     """
#     Convenience function to create a Notification and immediately
#     queue it for sending via Celery.

#     Use this from other parts of your app, e.g.:
#         from notifications.tasks import send_transactional_notification

#         # When order is confirmed:
#         send_transactional_notification(
#             user_id=order.user_id,
#             title="Order Confirmed! 🎉",
#             body=f"Your order #{order.id} has been confirmed.",
#             category="ORDER",
#             notification_type="ORDER_CONFIRMED",
#             data={"order_id": str(order.id), "deep_link": f"fishlo://order/{order.id}"},
#         )

#     Args:
#         user_id: The user to notify
#         title: Notification title
#         body: Notification body text
#         category: One of ORDER / PAYMENT / DELIVERY / PROMO / SYSTEM / BARGAIN
#         notification_type: e.g. ORDER_CONFIRMED
#         data: Optional dict for deep links / extra data

#     Returns:
#         notification_id (int)
#     """
#     from .models import Notification

#     # Create the record
#     notification = Notification.objects.create(
#         user_id=user_id,
#         title=title,
#         body=body,
#         category=category,
#         notification_type=notification_type,
#         data_json=data or {},
#         status=Notification.Status.CREATED,
#     )

#     # Log the creation event
#     from .models import NotificationEvent
#     NotificationEvent.objects.create(
#         notification=notification,
#         event_type=NotificationEvent.EventType.CREATED,
#     )

#     # Queue the Celery task (non-blocking)
#     send_notification_task.delay(notification.id)


#     return notification.id
