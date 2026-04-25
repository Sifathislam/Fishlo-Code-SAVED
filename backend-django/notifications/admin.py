"""
admin.py
--------
Django admin configuration for the notifications app.
Includes a "Send Campaign" button on the Campaign detail page.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import get_object_or_404, redirect
from django.contrib import messages

from .models import (
    Device,
    Notification,
    NotificationDelivery,
    NotificationPreference,
    Campaign,
    CampaignLog,
    NotificationEvent,
)


# ─────────────────────────────────────────────────────────────
# Device
# ─────────────────────────────────────────────────────────────

@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'platform', 'is_active', 'last_seen_at', 'created_at']
    list_filter = ['platform', 'is_active']
    search_fields = ['user__email', 'fcm_token', 'device_id']
    readonly_fields = ['created_at', 'updated_at', 'last_seen_at']
    ordering = ['-created_at']


# ─────────────────────────────────────────────────────────────
# Notification
# ─────────────────────────────────────────────────────────────

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'title', 'category',
        'notification_type', 'status', 'is_read', 'created_at'
    ]
    list_filter = ['status', 'category', 'is_read']
    search_fields = ['user__email', 'title', 'body']
    readonly_fields = ['created_at', 'sent_at', 'read_at']
    ordering = ['-created_at']


# ─────────────────────────────────────────────────────────────
# Notification Delivery
# ─────────────────────────────────────────────────────────────

@admin.register(NotificationDelivery)
class NotificationDeliveryAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'notification', 'device',
        'delivery_status', 'delivered_at', 'created_at'
    ]
    list_filter = ['delivery_status']
    readonly_fields = ['created_at', 'delivered_at']
    ordering = ['-created_at']


# ─────────────────────────────────────────────────────────────
# Notification Preference
# ─────────────────────────────────────────────────────────────

@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'order_updates_enabled', 'payment_updates_enabled',
        'promo_enabled', 'system_enabled',
    ]
    search_fields = ['user__email']


# ─────────────────────────────────────────────────────────────
# Campaign — with Send button on list + detail page
# ─────────────────────────────────────────────────────────────

@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'name', 'audience_type', 'status',
        'sent_count', 'failed_count', 'scheduled_at', 'created_at',
        'send_button',
    ]
    list_filter = ['status', 'audience_type']
    search_fields = ['name', 'title']
    readonly_fields = [
        'sent_count', 'failed_count', 'created_at', 'updated_at',
        'send_campaign_button',
        'campaign_status_badge',
    ]
    ordering = ['-created_at']
    actions = ['send_campaign_action']

    fieldsets = (
        ('🚀 Actions', {
            'fields': ('send_campaign_button', 'campaign_status_badge'),
        }),
        ('Campaign Info', {
            'fields': ('name', 'title', 'body', 'image_url', 'deep_link', 'data_json'),
        }),
        ('Audience', {
            'fields': ('audience_type', 'topic_name', 'scheduled_at'),
        }),
        ('Results', {
            'fields': ('sent_count', 'failed_count'),
        }),
        ('Meta', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    # ── List view: Send button per row ──────────────────────

    @admin.display(description='Send')
    def send_button(self, obj):
        if obj.status in (Campaign.Status.DRAFT, Campaign.Status.SCHEDULED):
            return format_html(
                '<a href="{}" '
                'style="background:#28a745;color:white;padding:4px 12px;'
                'border-radius:4px;text-decoration:none;font-size:14px;font-weight:bold;" '
                'onclick="return confirm(\'Send campaign: {}?\');">'
                'Send</a>',
                f'/admin/notifications/campaign/{obj.id}/send-campaign/',
                obj.name,
            )
        elif obj.status == Campaign.Status.SENDING:
            return format_html('<span style="color:#ffc107;font-weight:bold;">⏳ Sending</span>')
        elif obj.status == Campaign.Status.COMPLETED:
            return format_html('<span style="color:#28a745;font-weight:bold;">✅ Done</span>')
        else:
            return format_html('<span style="color:#dc3545;">❌ {}</span>', obj.status)

    # ── Detail page: big Send button ───────────────────────

    @admin.display(description='Send Campaign')
    def send_campaign_button(self, obj):
        if obj.pk is None:
            return "Save the campaign first, then you can send it."

        if obj.status in (Campaign.Status.DRAFT, Campaign.Status.SCHEDULED):
            return format_html(
                '<a href="{}" '
                'style="display:inline-block;padding:10px 28px;background:#28a745;'
                'color:white;border-radius:6px;text-decoration:none;'
                'font-size:15px;font-weight:bold;" '
                'onclick="return confirm(\'Send campaign \\\'{}\\\'?\\n\\nThis will notify all targeted users.\');">'
                '🚀 Send Campaign Now'
                '</a>'
                '<p style="color:#666;font-size:12px;margin-top:8px;">'
                'Runs in the background via Celery. This page will not freeze.'
                '</p>',
                f'/admin/notifications/campaign/{obj.id}/send-campaign/',
                obj.name,
            )
        elif obj.status == Campaign.Status.SENDING:
            return format_html(
                '<span style="color:#ffc107;font-size:14px;font-weight:bold;">'
                '⏳ Currently sending... Refresh to check progress.'
                '</span>'
            )
        elif obj.status == Campaign.Status.COMPLETED:
            return format_html(
                '<span style="color:#28a745;font-size:14px;font-weight:bold;">'
                '✅ Already sent — {} delivered, {} failed.'
                '</span>',
                obj.sent_count,
                obj.failed_count,
            )
        else:
            return format_html(
                '<span style="color:#dc3545;">❌ Cannot send — status is {}.</span>',
                obj.status,
            )

    # ── Detail page: colored status badge ──────────────────

    @admin.display(description='Current Status')
    def campaign_status_badge(self, obj):
        color_map = {
            'DRAFT':     '#6c757d',
            'SCHEDULED': '#007bff',
            'SENDING':   '#ffc107',
            'COMPLETED': '#28a745',
            'FAILED':    '#dc3545',
        }
        color = color_map.get(obj.status, '#333')
        return format_html(
            '<span style="background:{};color:white;padding:5px 16px;'
            'border-radius:12px;font-weight:bold;font-size:13px;">{}</span>',
            color,
            obj.status,
        )

    # ── Custom URL for the send action ─────────────────────

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:campaign_id>/send-campaign/',
                self.admin_site.admin_view(self.send_campaign_view),
                name='notifications_campaign_send',
            ),
        ]
        return custom_urls + urls   # custom BEFORE default

    def send_campaign_view(self, request, campaign_id):
        """Called when admin clicks the Send button."""
        campaign = get_object_or_404(Campaign, id=campaign_id)

        if campaign.status not in (Campaign.Status.DRAFT, Campaign.Status.SCHEDULED):
            messages.error(
                request,
                f"Cannot send '{campaign.name}' — status is '{campaign.status}'. "
                f"Only DRAFT or SCHEDULED campaigns can be sent."
            )
        else:
            try:
                from .tasks import send_campaign_task
                send_campaign_task.delay(campaign.id)
                messages.success(
                    request,
                    f"✅ Campaign '{campaign.name}' is now sending in the background! "
                    f"Refresh this page in a few seconds to see updated stats."
                )
            except Exception as e:
                messages.error(
                    request,
                    f"❌ Failed to queue campaign: {str(e)}"
                )

        return redirect(f'/admin/notifications/campaign/{campaign_id}/change/')

    # ── Bulk action in list view ────────────────────────────

    def send_campaign_action(self, request, queryset):
        from .tasks import send_campaign_task
        sent = skipped = 0
        for campaign in queryset:
            if campaign.status in (Campaign.Status.DRAFT, Campaign.Status.SCHEDULED):
                send_campaign_task.delay(campaign.id)
                sent += 1
            else:
                skipped += 1
        if sent:
            messages.success(request, f"✅ {sent} campaign(s) queued for sending.")
        if skipped:
            messages.warning(request, f"⚠️ {skipped} campaign(s) skipped (not DRAFT/SCHEDULED).")

    send_campaign_action.short_description = "🚀 Send selected campaigns"


# ─────────────────────────────────────────────────────────────
# Campaign Log
# ─────────────────────────────────────────────────────────────

@admin.register(CampaignLog)
class CampaignLogAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'campaign', 'total_targeted',
        'total_sent', 'total_failed', 'started_at', 'completed_at'
    ]
    readonly_fields = ['created_at']
    ordering = ['-created_at']


# ─────────────────────────────────────────────────────────────
# Notification Event
# ─────────────────────────────────────────────────────────────

@admin.register(NotificationEvent)
class NotificationEventAdmin(admin.ModelAdmin):
    list_display = ['id', 'notification', 'event_type', 'created_at']
    list_filter = ['event_type']
    readonly_fields = ['created_at']
    ordering = ['-created_at']