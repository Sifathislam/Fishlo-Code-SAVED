"""
management/commands/test_notification.py
-----------------------------------------
A Django management command to test the full notification pipeline
WITHOUT needing Firebase, Celery, or a real mobile device.

Usage:
    # Test sending to a user (prints to console instead of Firebase)
    python manage.py test_notification --user-id 1

    # Test a specific notification type
    python manage.py test_notification --user-id 1 --type ORDER_CONFIRMED

    # Test campaign flow
    python manage.py test_notification --campaign

    # Test quiet hours logic
    python manage.py test_notification --user-id 1 --check-quiet-hours

This command MOCKS Firebase so nothing is actually sent.
Perfect for local development and CI.
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Command(BaseCommand):
    help = 'Test notification pipeline without Firebase or Celery'

    def add_arguments(self, parser):
        parser.add_argument('--user-id', type=int, help='User ID to send test notification to')
        parser.add_argument(
            '--type',
            default='ORDER_CONFIRMED',
            help='Notification type (default: ORDER_CONFIRMED)',
        )
        parser.add_argument('--campaign', action='store_true', help='Test campaign creation')
        parser.add_argument('--check-quiet-hours', action='store_true', help='Check quiet hours status')
        parser.add_argument('--list-devices', action='store_true', help='List all registered devices')
        parser.add_argument('--list-notifications', action='store_true', help='List recent notifications')

    def handle(self, *args, **options):
        self.stdout.write('\n' + '='*60)
        self.stdout.write('🔔 FISHLO NOTIFICATION TESTER')
        self.stdout.write('='*60 + '\n')

        if options['list_devices']:
            self._list_devices()

        if options['list_notifications']:
            self._list_notifications(options.get('user_id'))

        if options['check_quiet_hours'] and options.get('user_id'):
            self._check_quiet_hours(options['user_id'])

        if options['campaign']:
            self._test_campaign()

        if options.get('user_id') and not options['campaign']:
            self._test_send_to_user(
                user_id=options['user_id'],
                notification_type=options['type'],
            )

        if not any([
            options.get('user_id'),
            options['campaign'],
            options['list_devices'],
            options['list_notifications'],
        ]):
            self.stdout.write(self.style.WARNING(
                "No action specified. Use --help to see options.\n"
                "\nQuick examples:\n"
                "  python manage.py test_notification --user-id 1\n"
                "  python manage.py test_notification --list-devices\n"
                "  python manage.py test_notification --campaign\n"
            ))

    # ─────────────────────────────────────────────────────────
    def _test_send_to_user(self, user_id: int, notification_type: str):
        """
        Creates a real Notification record in DB and simulates sending.
        Mocks Firebase — nothing is actually sent to a device.
        """
        from notifications.models import Notification, Device, NotificationEvent

        self.stdout.write(f"📤 Testing notification send to user #{user_id}...")

        # Check user exists
        try:
            user = User.objects.get(id=user_id)
            self.stdout.write(f"   User: {user.email if hasattr(user, 'email') else user}")
        except User.DoesNotExist:
            raise CommandError(f"User #{user_id} not found.")

        # Check devices
        devices = Device.objects.filter(user=user, is_active=True)
        self.stdout.write(f"   Active devices: {devices.count()}")

        if devices.count() == 0:
            self.stdout.write(self.style.WARNING(
                "   ⚠️  No active devices found. Creating a fake test device..."
            ))
            # Create a fake device for testing
            device = Device.objects.create(
                user=user,
                fcm_token=f'FAKE_TEST_TOKEN_{user_id}_{timezone.now().timestamp()}',
                platform='ANDROID',
                device_id='test-device',
                is_active=True,
            )
            self.stdout.write(f"   ✅ Fake device created: #{device.id}")
            devices = Device.objects.filter(user=user, is_active=True)

        # Map type to category
        type_to_category = {
            'ORDER_CONFIRMED': 'ORDER',
            'ORDER_CANCELLED': 'ORDER',
            'PAYMENT_SUCCESS': 'PAYMENT',
            'PAYMENT_FAILED': 'PAYMENT',
            'OUT_FOR_DELIVERY': 'DELIVERY',
            'DELIVERED': 'DELIVERY',
            'PROMO_OFFER': 'PROMO',
            'SYSTEM_ALERT': 'SYSTEM',
            'BARGAIN_UPDATE': 'BARGAIN',
        }
        category = type_to_category.get(notification_type, 'SYSTEM')

        # Create real Notification record
        notification = Notification.objects.create(
            user=user,
            title=f'[TEST] {notification_type.replace("_", " ").title()}',
            body=f'This is a test notification of type {notification_type}.',
            category=category,
            notification_type=notification_type,
            data_json={
                'test': True,
                'deep_link': f'fishlo://test/{notification_type.lower()}',
            },
            status=Notification.Status.CREATED,
        )
        self.stdout.write(f"   ✅ Notification created: #{notification.id}")

        # Log CREATED event
        NotificationEvent.objects.create(
            notification=notification,
            event_type=NotificationEvent.EventType.CREATED,
            event_data={'source': 'management_command_test'},
        )

        # ── Mock Firebase send ────────────────────────────────
        self.stdout.write('\n   🔥 Simulating Firebase send (MOCKED)...')
        self.stdout.write(f'   Firebase would send to {devices.count()} device(s):')

        from notifications.models import NotificationDelivery

        for device in devices:
            is_fake = device.fcm_token.startswith('FAKE_TEST_TOKEN')

            self.stdout.write(
                f'     → Device #{device.id} | {device.platform} | '
                f'token={device.fcm_token[:20]}...'
            )

            # Create delivery record (as if sent)
            NotificationDelivery.objects.create(
                notification=notification,
                device=device,
                fcm_message_id=f'mock_message_id_{device.id}',
                delivery_status=NotificationDelivery.DeliveryStatus.SENT,
                delivered_at=timezone.now(),
            )

            self.stdout.write(self.style.SUCCESS(
                f'       ✅ Delivery recorded (MOCKED - not actually sent)'
            ))

        # Update notification status
        notification.status = Notification.Status.SENT
        notification.sent_at = timezone.now()
        notification.save(update_fields=['status', 'sent_at'])

        NotificationEvent.objects.create(
            notification=notification,
            event_type=NotificationEvent.EventType.SENT,
            event_data={'mock': True, 'device_count': devices.count()},
        )

        self.stdout.write('\n' + self.style.SUCCESS(
            f'✅ Test complete! Notification #{notification.id} saved to DB.\n'
            f'   Check Django admin → Notifications to see it.\n'
            f'   Check Django admin → Notification Deliveries for delivery records.\n'
        ))

    # ─────────────────────────────────────────────────────────
    def _test_campaign(self):
        """Creates a test campaign record."""
        from notifications.models import Campaign

        self.stdout.write("📢 Testing campaign creation...")

        # Get first admin user
        admin = User.objects.filter(is_staff=True).first()
        if not admin:
            raise CommandError("No admin/staff user found. Create one first.")

        campaign = Campaign.objects.create(
            name=f'Test Campaign {timezone.now().strftime("%Y%m%d_%H%M%S")}',
            title='[TEST] Special Offer! 🎉',
            body='This is a test campaign notification from Fishlo.',
            audience_type=Campaign.AudienceType.ALL,
            status=Campaign.Status.DRAFT,
            created_by=admin,
        )

        self.stdout.write(self.style.SUCCESS(
            f'✅ Campaign #{campaign.id} "{campaign.name}" created as DRAFT.\n'
            f'   To send it:\n'
            f'   POST /api/notifications/campaigns/{campaign.id}/send/\n'
            f'   Or via Django admin → Campaigns → select → "Send selected campaigns"\n'
        ))

    # ─────────────────────────────────────────────────────────
    def _list_devices(self):
        from notifications.models import Device

        devices = Device.objects.select_related('user').order_by('-created_at')[:20]
        self.stdout.write(f"📱 Registered Devices (last 20):\n")

        if not devices:
            self.stdout.write(self.style.WARNING("   No devices registered yet."))
            self.stdout.write(
                "   Tip: POST to /api/notifications/devices/register/ to add one.\n"
            )
            return

        for d in devices:
            status = '🟢' if d.is_active else '🔴'
            self.stdout.write(
                f"   {status} ID#{d.id} | User: {d.user} | "
                f"{d.platform} | token: {d.fcm_token[:25]}..."
            )
        self.stdout.write('')

    # ─────────────────────────────────────────────────────────
    def _list_notifications(self, user_id=None):
        from notifications.models import Notification

        qs = Notification.objects.select_related('user').order_by('-created_at')
        if user_id:
            qs = qs.filter(user_id=user_id)
        notifications = qs[:20]

        label = f"for user #{user_id}" if user_id else "(all users)"
        self.stdout.write(f"🔔 Recent Notifications {label}:\n")

        if not notifications:
            self.stdout.write(self.style.WARNING("   No notifications yet."))
            return

        for n in notifications:
            read = '✅' if n.is_read else '🔵'
            self.stdout.write(
                f"   {read} ID#{n.id} | {n.notification_type} | "
                f"{n.status} | {n.created_at.strftime('%Y-%m-%d %H:%M')}"
            )
        self.stdout.write('')

    # ─────────────────────────────────────────────────────────
    def _check_quiet_hours(self, user_id: int):
        from notifications.signals import _is_quiet_hours
        from notifications.models import NotificationPreference

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise CommandError(f"User #{user_id} not found.")

        is_quiet = _is_quiet_hours(user)
        now = timezone.localtime(timezone.now()).time()

        self.stdout.write(f"🌙 Quiet Hours Check for user #{user_id}:")
        self.stdout.write(f"   Current time: {now.strftime('%H:%M')}")

        try:
            pref = NotificationPreference.objects.get(user=user)
            if pref.quiet_hours_start and pref.quiet_hours_end:
                self.stdout.write(
                    f"   Quiet hours: {pref.quiet_hours_start} → {pref.quiet_hours_end}"
                )
            else:
                self.stdout.write("   Quiet hours: not set")
        except NotificationPreference.DoesNotExist:
            self.stdout.write("   Preference: not set (default = all allowed)")

        if is_quiet:
            self.stdout.write(self.style.WARNING("   🌙 Status: QUIET HOURS ACTIVE — notifications paused"))
        else:
            self.stdout.write(self.style.SUCCESS("   ✅ Status: OK — notifications will send"))
        self.stdout.write('')
