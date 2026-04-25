"""
views.py
--------
All API views for the notifications app.

Endpoints:
  POST   /api/notifications/devices/register/    → Save FCM token after login
  DELETE /api/notifications/devices/deregister/  → Remove FCM token on logout

  GET    /api/notifications/                     → User's notification inbox
  GET    /api/notifications/<id>/                → Single notification detail
  POST   /api/notifications/mark-read/           → Mark one/many/all as read
  GET    /api/notifications/unread-count/        → Badge count for app icon

  GET    /api/notifications/preferences/         → Get user preferences
  PUT    /api/notifications/preferences/         → Update preferences
  PATCH  /api/notifications/preferences/         → Partial update

  GET    /api/notifications/campaigns/           → List campaigns (admin)
  POST   /api/notifications/campaigns/           → Create campaign (admin)
  POST   /api/notifications/campaigns/<id>/send/ → Trigger campaign send (admin)
  GET    /api/notifications/campaigns/<id>/logs/ → Campaign performance logs
"""

import logging
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Device,
    Notification,
    NotificationEvent,
    NotificationPreference,
    Campaign,
    CampaignLog,
)
from .serializers import (
    DeviceRegisterSerializer,
    DeviceSerializer,
    NotificationSerializer,
    MarkReadSerializer,
    NotificationPreferenceSerializer,
    CampaignSerializer,
    CampaignLogSerializer,
)



# ═══════════════════════════════════════════════════════════════
# DEVICE MANAGEMENT — FCM Token save/remove
# ═══════════════════════════════════════════════════════════════

class DeviceRegisterView(APIView):
    """
    POST /api/notifications/devices/register/

    Mobile app calls this AFTER user logs in to save the FCM token.
    If the token already exists (same device, re-login), it gets
    reactivated and reassigned to the current user.

    Request body:
        {
            "fcm_token": "eXyzAbc...",
            "platform": "ANDROID",     ← or "IOS"
            "device_id": "optional"
        }

    Response 201: device registered for first time
    Response 200: existing token updated/reactivated
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DeviceRegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        device, created = serializer.save_or_update(user=request.user)
        return Response(
            {
                'message': 'Device registered successfully.' if created else 'Device updated.',
                'device': DeviceSerializer(device).data,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class DeviceDeregisterView(APIView):
    """
    DELETE /api/notifications/devices/deregister/

    Call this when user logs OUT so we stop sending notifications
    to this device until they log in again.

    Request body:
        { "fcm_token": "eXyzAbc..." }
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        fcm_token = request.data.get('fcm_token')

        if not fcm_token:
            return Response(
                {'error': 'fcm_token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated = Device.objects.filter(
            fcm_token=fcm_token,
            user=request.user,
        ).delete()

        if updated == 0:
            return Response(
                {'error': 'Device not found or does not belong to this user.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({'message': 'Device deregistered successfully.'})


# ═══════════════════════════════════════════════════════════════
# NOTIFICATION INBOX
# ═══════════════════════════════════════════════════════════════

class NotificationListView(APIView):
    """
    GET /api/notifications/

    Returns the user's notification inbox (newest first).
    Supports filtering by:
      ?is_read=false      → only unread
      ?category=ORDER     → by category
      ?page=1&page_size=20

    Response:
        {
            "count": 42,
            "next_page": 2,        ← null if no more pages
            "results": [ {...}, ... ]
        }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Notification.objects.filter(user=request.user)

        # Optional filters
        is_read = request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')

        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category.upper())

        # Simple manual pagination (no extra package needed for MVP)
        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            page_size = min(page_size, 100)  # cap at 100
        except ValueError:
            page = 1
            page_size = 20

        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        notifications = queryset[start:end]

        has_next = end < total

        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'next_page': page + 1 if has_next else None,
            'results': NotificationSerializer(notifications, many=True).data,
        })


class NotificationDetailView(APIView):
    """
    GET /api/notifications/<id>/

    Returns a single notification.
    Also logs an OPENED event (for analytics).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=request.user,   # users can only see their own
            )
        except Notification.DoesNotExist:
            return Response(
                {'error': 'Notification not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Log OPENED event when user views the notification
        NotificationEvent.objects.get_or_create(
            notification=notification,
            event_type=NotificationEvent.EventType.OPENED,
        )

        # Auto mark as read when opened
        notification.mark_as_read()

        return Response(NotificationSerializer(notification).data)


class MarkNotificationsReadView(APIView):
    """
    POST /api/notifications/mark-read/

    Mark specific notifications as read, OR mark all as read.

    Mark specific:
        { "notification_ids": [1, 2, 3] }

    Mark all unread:
        { "mark_all": true }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MarkReadSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()

        if serializer.validated_data.get('mark_all'):
            updated = Notification.objects.filter(
                user=request.user,
                is_read=False,
            ).update(is_read=True, read_at=now)

            return Response({
                'message': f'{updated} notifications marked as read.'
            })

        # Mark specific IDs
        notification_ids = serializer.validated_data.get('notification_ids', [])
        updated = Notification.objects.filter(
            id__in=notification_ids,
            user=request.user,   # security: can only mark own notifications
            is_read=False,
        ).update(is_read=True, read_at=now)

        return Response({
            'message': f'{updated} notifications marked as read.'
        })


class UnreadCountView(APIView):
    """
    GET /api/notifications/unread-count/

    Returns the unread count for the app icon badge.

    Response:
        { "unread_count": 7 }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).count()

        return Response({'unread_count': count})


# ═══════════════════════════════════════════════════════════════
# USER PREFERENCES
# ═══════════════════════════════════════════════════════════════

class NotificationPreferenceView(APIView):
    """
    GET   /api/notifications/preferences/   → get current settings
    PUT   /api/notifications/preferences/   → full update
    PATCH /api/notifications/preferences/   → partial update (recommended)

    Example PATCH to disable promos:
        { "promo_enabled": false }

    Example PATCH to set quiet hours (10pm to 8am):
        {
            "quiet_hours_start": "22:00",
            "quiet_hours_end": "08:00"
        }
    """
    permission_classes = [IsAuthenticated]

    def _get_or_create_preference(self, user):
        """Get preference or create with default values (all enabled)."""
        pref, _ = NotificationPreference.objects.get_or_create(user=user)
        return pref

    def get(self, request):
        pref = self._get_or_create_preference(request.user)
        return Response(NotificationPreferenceSerializer(pref).data)

    def put(self, request):
        pref = self._get_or_create_preference(request.user)
        serializer = NotificationPreferenceSerializer(pref, data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        pref = self._get_or_create_preference(request.user)
        serializer = NotificationPreferenceSerializer(
            pref,
            data=request.data,
            partial=True,   # ← allows sending only changed fields
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data)


# ═══════════════════════════════════════════════════════════════
# CAMPAIGNS (Admin only)
# ═══════════════════════════════════════════════════════════════

class CampaignListCreateView(APIView):
    """
    GET  /api/notifications/campaigns/   → List all campaigns
    POST /api/notifications/campaigns/   → Create a new campaign (DRAFT status)

    Admin only.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        campaigns = Campaign.objects.all().order_by('-created_at')
        return Response(CampaignSerializer(campaigns, many=True).data)

    def post(self, request):
        serializer = CampaignSerializer(
            data=request.data,
            context={'request': request},   # needed for CurrentUserDefault
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        campaign = serializer.save()
        return Response(
            CampaignSerializer(campaign, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class CampaignSendView(APIView):
    """
    POST /api/notifications/campaigns/<id>/send/

    Triggers a campaign to start sending immediately.
    Runs asynchronously via Celery.

    Admin only.
    """
    permission_classes = [IsAdminUser]

    def post(self, request, campaign_id):
        try:
            campaign = Campaign.objects.get(id=campaign_id)
        except Campaign.DoesNotExist:
            return Response(
                {'error': 'Campaign not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Only DRAFT or SCHEDULED campaigns can be sent
        if campaign.status not in (Campaign.Status.DRAFT, Campaign.Status.SCHEDULED):
            return Response(
                {
                    'error': f"Cannot send a campaign with status '{campaign.status}'. "
                             f"Only DRAFT or SCHEDULED campaigns can be sent."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Queue the Celery task
        from .tasks import send_campaign_task
        send_campaign_task.delay(campaign.id)
        # send_campaign_task(campaign.id)


        return Response({
            'message': f"Campaign '{campaign.name}' is now being sent in the background.",
            'campaign_id': campaign.id,
        })


class CampaignLogsView(APIView):
    """
    GET /api/notifications/campaigns/<id>/logs/

    Returns performance logs for a campaign.
    Admin only.
    """
    permission_classes = [IsAdminUser]

    def get(self, request, campaign_id):
        try:
            campaign = Campaign.objects.get(id=campaign_id)
        except Campaign.DoesNotExist:
            return Response(
                {'error': 'Campaign not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        logs = CampaignLog.objects.filter(campaign=campaign).order_by('-created_at')
        return Response({
            'campaign': campaign.name,
            'current_status': campaign.status,
            'total_sent': campaign.sent_count,
            'total_failed': campaign.failed_count,
            'logs': CampaignLogSerializer(logs, many=True).data,
        })
