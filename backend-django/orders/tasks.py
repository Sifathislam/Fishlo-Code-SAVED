
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from payments.services.payment_reconciliation import PaymentReconciliationService
from .models.orders_models import Order



@shared_task(bind=True,name='orders.tasks.reconcile_pending_payments',max_retries=3,default_retry_delay=300)
def reconcile_pending_payments(self):
    """
    Reconcile all pending payments with Razorpay.
    Runs every 15 minutes via Celery Beat.
    """
    try:        
        reconciliation = PaymentReconciliationService()
        stats = reconciliation.reconcile_all_pending()
        

        return {
            'success': True,
            'stats': stats,
            'timestamp': timezone.now().isoformat()
        }
        
    except Exception as e:
        # Retry task on failure
        raise self.retry(exc=e)


@shared_task(name='orders.tasks.cancel_expired_orders')
def cancel_expired_orders():
    """
    Cancel orders that have been pending for more than 30 minutes.
    Runs every 30 minutes.
    """
    try:
        timeout = timezone.now() - timedelta(minutes=1)
        
        expired_orders = Order.objects.filter(
            payment_status='PENDING',
            created_at__lt=timeout
        ).exclude(payment_method='COD')
        
        cancelled_count = 0
        for order in expired_orders:
            order.status = Order.OrderStatus.CANCELLED
            order.payment_status = 'FAILED'
            order.save(update_fields=['status', 'payment_status'])
            cancelled_count += 1
        
        
        return {
            'success': True,
            'cancelled_count': cancelled_count,
            'timestamp': timezone.now().isoformat()
        }
        
    except Exception as e:
        return {'success': False, 'error': str(e)}


@shared_task(name='orders.tasks.reconcile_single_order')
def reconcile_single_order_async(order_id):
    """
    Asynchronous version of single order reconciliation.
    Can be called from views for background processing.
    """
    try:
        reconciliation = PaymentReconciliationService()
        result = reconciliation.reconcile_single_order(order_id)
        
        return result
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

