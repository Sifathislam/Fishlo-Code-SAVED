from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


# ─────────────────────────────────────────────
# Device Model — Stores FCM tokens per device
# ─────────────────────────────────────────────
class Device(models.Model):

    class Platform(models.TextChoices):
        ANDROID = 'ANDROID', 'Android'
        IOS = 'IOS', 'iOS'

    # user can be null for guest users
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='devices'
    )
    fcm_token = models.TextField(unique=True)                      # Firebase token
    platform = models.CharField(max_length=10, choices=Platform.choices)
    device_id = models.CharField(max_length=255, blank=True, null=True)  
    is_active = models.BooleanField(default=True)
    last_seen_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notification_devices'
        indexes = [
            models.Index(fields=['user', 'is_active']),  # fast lookup for active devices
            models.Index(fields=['fcm_token']),
        ]

    def __str__(self):
        return f"{self.user} | {self.platform} | active={self.is_active}"


# ─────────────────────────────────────────────
#  Notification Model — In-App Inbox + Source of Truth
# ─────────────────────────────────────────────
class Notification(models.Model):

    class Category(models.TextChoices):
        ORDER = 'ORDER', 'Order'
        PAYMENT = 'PAYMENT', 'Payment'
        DELIVERY = 'DELIVERY', 'Delivery'
        PROMO = 'PROMO', 'Promo'
        SYSTEM = 'SYSTEM', 'System'

    class NotificationType(models.TextChoices):
        ORDER_CONFIRMED = 'ORDER_CONFIRMED', 'Order Confirmed'
        ORDER_CANCELLED = 'ORDER_CANCELLED', 'Order Cancelled'
        PAYMENT_SUCCESS = 'PAYMENT_SUCCESS', 'Payment Success'
        PAYMENT_FAILED = 'PAYMENT_FAILED', 'Payment Failed'
        OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', 'Out for Delivery'
        DELIVERED = 'DELIVERED', 'Delivered'
        PROMO_OFFER = 'PROMO_OFFER', 'Promo Offer'
        SYSTEM_ALERT = 'SYSTEM_ALERT', 'System Alert'

    class Status(models.TextChoices):
        CREATED = 'CREATED', 'Created'
        QUEUED = 'QUEUED', 'Queued'
        SENT = 'SENT', 'Sent'
        FAILED = 'FAILED', 'Failed'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    body = models.TextField()
    category = models.CharField(max_length=20, choices=Category.choices)
    notification_type = models.CharField(max_length=50, choices=NotificationType.choices)
    data_json = models.JSONField(default=dict, blank=True)        # deep link + extra data
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CREATED)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', 'status']),
        ]

    def mark_as_read(self):
        """Mark notification as read."""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])

    def __str__(self):
        return f"{self.user} | {self.notification_type} | {self.status}"


# ─────────────────────────────────────────────
#  Notification Delivery — Per-Device Delivery Tracking
# ─────────────────────────────────────────────
class NotificationDelivery(models.Model):

    class DeliveryStatus(models.TextChoices):
        SENT = 'SENT', 'Sent'
        FAILED = 'FAILED', 'Failed'
        INVALID_TOKEN = 'INVALID_TOKEN', 'Invalid Token'

    notification = models.ForeignKey(
        Notification, on_delete=models.CASCADE, related_name='deliveries'
    )
    device = models.ForeignKey(
        Device, on_delete=models.CASCADE, related_name='deliveries'
    )
    fcm_message_id = models.CharField(max_length=255, blank=True, null=True)   # Firebase message ID
    delivery_status = models.CharField(max_length=20, choices=DeliveryStatus.choices)
    error_message = models.TextField(blank=True, null=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notification_deliveries'
        indexes = [
            models.Index(fields=['notification', 'delivery_status']),
        ]

    def __str__(self):
        return f"Notif#{self.notification_id} → Device#{self.device_id} | {self.delivery_status}"


# ─────────────────────────────────────────────
# Notification Preference — User Controls
# ─────────────────────────────────────────────
class NotificationPreference(models.Model):

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='notification_preference'
    )
    order_updates_enabled = models.BooleanField(default=True)
    payment_updates_enabled = models.BooleanField(default=True)
    delivery_updates_enabled = models.BooleanField(default=True)
    promo_enabled = models.BooleanField(default=True)
    system_enabled = models.BooleanField(default=True)
    quiet_hours_start = models.TimeField(null=True, blank=True)    # e.g. 22:00
    quiet_hours_end = models.TimeField(null=True, blank=True)      # e.g. 08:00
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notification_preferences'

    def is_category_enabled(self, category: str) -> bool:
        """Check if a notification category is enabled for this user."""
        mapping = {
            'ORDER': self.order_updates_enabled,
            'PAYMENT': self.payment_updates_enabled,
            'DELIVERY': self.delivery_updates_enabled,
            'PROMO': self.promo_enabled,
            'SYSTEM': self.system_enabled,
        }
        return mapping.get(category, True)

    def __str__(self):
        return f"Preferences for {self.user}"


# ─────────────────────────────────────────────
#  Campaign Model — Bulk / Marketing Notifications
# ─────────────────────────────────────────────
class Campaign(models.Model):

    class AudienceType(models.TextChoices):
        ALL = 'ALL', 'All Users'

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SCHEDULED = 'SCHEDULED', 'Scheduled'
        SENDING = 'SENDING', 'Sending'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'

    name = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    body = models.TextField()
    image_url = models.URLField(blank=True, null=True)
    deep_link = models.CharField(max_length=500, blank=True)
    data_json = models.JSONField(default=dict, blank=True)
    audience_type = models.CharField(max_length=20, choices=AudienceType.choices, default=AudienceType.ALL)
    topic_name = models.CharField(max_length=255, blank=True, null=True)   # for TOPIC audience
    scheduled_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    sent_count = models.PositiveIntegerField(default=0)
    failed_count = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='campaigns'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notification_campaigns'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} | {self.status}"


# ─────────────────────────────────────────────
#  Campaign Log — Performance Tracking
# ─────────────────────────────────────────────
class CampaignLog(models.Model):

    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='logs')
    total_targeted = models.PositiveIntegerField(default=0)
    total_sent = models.PositiveIntegerField(default=0)
    total_failed = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notification_campaign_logs'

    def __str__(self):
        return f"Log for {self.campaign.name} | sent={self.total_sent}"


# ─────────────────────────────────────────────
# Notification Event Log — Full Audit Trail
# ─────────────────────────────────────────────
class NotificationEvent(models.Model):

    class EventType(models.TextChoices):
        CREATED = 'CREATED', 'Created'
        QUEUED = 'QUEUED', 'Queued'
        SENT = 'SENT', 'Sent'
        FAILED = 'FAILED', 'Failed'
        OPENED = 'OPENED', 'Opened'     # when user taps notification

    notification = models.ForeignKey(
        Notification, on_delete=models.CASCADE, related_name='events'
    )
    event_type = models.CharField(max_length=20, choices=EventType.choices)
    event_data = models.JSONField(default=dict, blank=True)    # any extra context
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notification_events'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['notification', 'event_type']),
        ]

    def __str__(self):
        return f"Notif#{self.notification_id} | {self.event_type}"