"""
apps.py (Phase 4)
-----------------
Initializes Firebase + connects signals on Django startup.
"""

import logging
import sys
from django.apps import AppConfig

logger = logging.getLogger(__name__)

SKIP_COMMANDS = (
    'makemigrations', 'migrate', 'collectstatic',
    'shell', 'dbshell', 'test', 'createsuperuser',
    'showmigrations', 'sqlmigrate',
)


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'
    verbose_name = 'Notifications'

    def ready(self):
        is_management_command = (
            len(sys.argv) > 1 and sys.argv[1] in SKIP_COMMANDS
        )
        if is_management_command:
            return

        # ── Initialize Firebase ──────────────────────────────
        try:
            from .firebase import get_firebase_app
            get_firebase_app()
        except Exception as e:
            logger.warning(f"Firebase not initialized at startup: {e}")

        # ── Connect Signals ──────────────────────────────────
        self._connect_order_signal()
        self._connect_payment_signal()

    def _connect_order_signal(self):
        try:
            from django.apps import apps
            from django.db.models.signals import post_save
            from .signals import handle_order_status_change
            Order = apps.get_model('orders', 'Order')  # ← change 'orders' to your app name
            post_save.connect(handle_order_status_change, sender=Order)
            logger.info("Order notification signal connected.")
        except LookupError:
            logger.warning("Order model not found — update app name in apps.py")
        except Exception as e:
            logger.error(f"Failed to connect order signal: {e}")

    def _connect_payment_signal(self):
        try:
            from django.apps import apps
            from django.db.models.signals import post_save
            from .signals import handle_payment_status_change
            Payment = apps.get_model('payments', 'Payment')  # ← change 'payments'
            post_save.connect(handle_payment_status_change, sender=Payment)
            logger.info("Payment notification signal connected.")
        except LookupError:
            logger.warning("Payment model not found — update app name in apps.py")
        except Exception as e:
            logger.error(f"Failed to connect payment signal: {e}")
