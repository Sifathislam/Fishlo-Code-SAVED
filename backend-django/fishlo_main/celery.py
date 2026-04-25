import os
from celery import Celery
from celery.schedules import crontab

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fishlo_main.settings')

# Create Celery app
app = Celery('fishlo_main')

# Load config from Django settings (CELERY_ prefix)
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()

# Celery Beat Schedule (Periodic Tasks)
app.conf.beat_schedule = {
    # Reconcile payments every 15 minutes
    'reconcile-pending-payments': {
        'task': 'orders.tasks.reconcile_pending_payments',
        'schedule': crontab(minute='*/1'),  # Every 15 minutes
        # 'options': {
        #     'expires': 600,  # Task expires after 10 minutes
        # }
    },
    
    # Cancel expired orders every 30 minutes
    'cancel-expired-orders': {
        'task': 'orders.tasks.cancel_expired_orders',
        'schedule': crontab(minute='*/1'),  # Every 30 minutes
    }
}