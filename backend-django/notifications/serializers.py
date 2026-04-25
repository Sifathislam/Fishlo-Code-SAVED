"""
serializers.py
--------------
DRF serializers for the notifications app.

Covers:
  - FCM token registration / update
  - Notification list (inbox)
  - Notification detail
  - Mark as read
  - User preferences (get + update)
  - Campaign (admin use)
"""

from rest_framework import serializers
from .models import (
    Device,
    Notification,
    NotificationPreference,
    Campaign,
    CampaignLog,
)


# ─────────────────────────────────────────────────────────────
# 1. Device / FCM Token
# ─────────────────────────────────────────────────────────────
class DeviceRegisterSerializer(serializers.ModelSerializer):

    device_id = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Device
        fields = ['fcm_token', 'platform', 'device_id']

    def save_or_update(self, user):
        from django.utils import timezone

        fcm_token = self.validated_data['fcm_token']
        platform = self.validated_data['platform']
        device_id = self.validated_data.get('device_id', '')

        device, created = Device.objects.update_or_create(
            fcm_token=fcm_token,
            defaults={
                "user": user,
                "platform": platform,
                "device_id": device_id,
                "is_active": True,
                "last_seen_at": timezone.now(),
            }
        )

        return device, created
    
    

class DeviceSerializer(serializers.ModelSerializer):
    """Read-only device info."""

    class Meta:
        model = Device
        fields = ['id', 'platform', 'device_id', 'is_active', 'last_seen_at', 'created_at']
        read_only_fields = fields


# ─────────────────────────────────────────────────────────────
# 2. Notification (Inbox)
# ─────────────────────────────────────────────────────────────

class NotificationSerializer(serializers.ModelSerializer):
    """
    Notification list item for in-app inbox.

    Returned by GET /api/notifications/
    """

    class Meta:
        model = Notification
        fields = [
            'id',
            'title',
            'body',
            'category',
            'notification_type',
            'data_json',
            'is_read',
            'read_at',
            'created_at',
        ]
        read_only_fields = fields


class MarkReadSerializer(serializers.Serializer):
    """
    Body for marking notifications as read.

    POST /api/notifications/mark-read/
    {
        "notification_ids": [1, 2, 3]    ← specific IDs
    }

    Or mark ALL unread:
    POST /api/notifications/mark-read/
    {
        "mark_all": true
    }
    """
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
    )
    mark_all = serializers.BooleanField(required=False, default=False)

    def validate(self, data):
        if not data.get('mark_all') and not data.get('notification_ids'):
            raise serializers.ValidationError(
                "Provide either 'notification_ids' list or set 'mark_all' to true."
            )
        return data


# ─────────────────────────────────────────────────────────────
# 3. Notification Preference
# ─────────────────────────────────────────────────────────────

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """
    GET  /api/notifications/preferences/   → returns current preferences
    PUT  /api/notifications/preferences/   → update preferences
    PATCH /api/notifications/preferences/  → partial update
    """

    class Meta:
        model = NotificationPreference
        fields = [
            'order_updates_enabled',
            'payment_updates_enabled',
            'delivery_updates_enabled',
            'promo_enabled',
            'system_enabled',
            'quiet_hours_start',
            'quiet_hours_end',
            'updated_at',
        ]
        read_only_fields = ['updated_at']


# ─────────────────────────────────────────────────────────────
# 4. Campaign (Admin only)
# ─────────────────────────────────────────────────────────────

class CampaignSerializer(serializers.ModelSerializer):
    """
    For creating and viewing campaigns.
    POST /api/notifications/campaigns/
    """
    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Campaign
        fields = [
            'id',
            'name',
            'title',
            'body',
            'image_url',
            'deep_link',
            'data_json',
            'audience_type',
            'topic_name',
            'scheduled_at',
            'status',
            'sent_count',
            'failed_count',
            'created_by',
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'sent_count', 'failed_count', 'created_at']

    def validate(self, data):
        # If audience is TOPIC, topic_name is required
        if data.get('audience_type') == Campaign.AudienceType.TOPIC:
            if not data.get('topic_name'):
                raise serializers.ValidationError(
                    "topic_name is required when audience_type is TOPIC."
                )
        return data


class CampaignLogSerializer(serializers.ModelSerializer):
    """Read-only campaign performance log."""

    class Meta:
        model = CampaignLog
        fields = [
            'id',
            'total_targeted',
            'total_sent',
            'total_failed',
            'started_at',
            'completed_at',
            'created_at',
        ]
        read_only_fields = fields
