# orders/payment_reconciliation.py

from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from ..models import Payment
from orders.models.orders_models import Order, OrderTracking,OrderAddress
from . import PaymentService
from orders.models.cart_models import Cart




class PaymentReconciliationService:
    """
    Handles payment reconciliation for orders where users didn't complete the flow.
    Used by: Login handler, Manual check, Cron jobs
    """
    
    def __init__(self):
        self.payment_service = PaymentService()
        self.timeout_minutes = 30  # Auto-cancel after 30 min
    
    def reconcile_user_orders(self, user):
        """
        Check all pending orders for a specific user.
        Call this when user logs in or opens the app or open the order page.
        
        Returns: List of reconciled orders
        """
        pending_orders = Order.objects.filter(
            user=user,
            payment_status='PENDING',
            created_at__gte=timezone.now() - timedelta(minutes=self.timeout_minutes)
        )
        
        reconciled = []
        for order in pending_orders:
            result = self._reconcile_single_order(order)
            if result:
                reconciled.append(result)
        
        return reconciled
    
    def reconcile_single_order(self, order_id):
        """
        Manually check a specific order.
        Used for "Check Payment Status" button.
        """
        try:
            order = Order.objects.get(id=order_id)
            return self._reconcile_single_order(order)
        except Order.DoesNotExist:
            return {'success': False, 'message': 'Order not found'}
    
    def reconcile_all_pending(self):
        """
        Scheduled job: Check ALL pending payments.
        Run this every 15 minutes via celery.
        """
        cutoff_time = timezone.now() - timedelta(minutes=5) # order not older then 5 min is not counted 
        timeout_cutoff = timezone.now() - timedelta(minutes=self.timeout_minutes) #order older then 30 min is not counted
        
        pending_orders = Order.objects.filter(
            payment_status='PENDING',
            created_at__gte=timeout_cutoff,
            created_at__lte=cutoff_time
        )
        
        stats = {'verified': 0, 'cancelled': 0, 'still_pending': 0}
        
        for order in pending_orders:
            result = self._reconcile_single_order(order)
            if result:
                stats[result['status']] = stats.get(result['status'], 0) + 1
        
        return stats
    
    def _reconcile_single_order(self, order):
        """Core reconciliation logic """
        payment = order.payments.filter(status='PENDING').first()
        
        if not payment or not payment.gateway_order_id:
            return None
        
        # Check if payment timed out
        if order.created_at < timezone.now() - timedelta(minutes=self.timeout_minutes):
            return self._cancel_payment(order, payment, "Payment timeout")
        
        # Always check Razorpay order for payments
        # This works even if callback never ran
        try:
            # Fetch all payments for this Razorpay order
            order_payments = self.payment_service.get_payments_for_order(
                payment.gateway_order_id
            )
            
            if order_payments and len(order_payments) > 0:
                # Payment exists! User paid but callback didn't run
                latest_payment = order_payments[0]  # Get most recent payment
                
                # Check payment status
                payment_status = latest_payment.get('status')
                
                if payment_status == 'captured':
                    # Payment successful - save payment_id and complete order
                    return self._complete_payment(order, payment, latest_payment)
                
                elif payment_status in ['failed', 'cancelled']:
                    return self._cancel_payment(order, payment, "Payment failed at gateway")
                
                else:
                    # Payment authorized but not captured yet
                    return {'success': True, 'status': 'still_pending', 'order_id': order.id}
            
            else:
                # No payment found - user created order but didn't pay
                return {'success': True, 'status': 'still_pending', 'order_id': order.id}
                
        except Exception as e:
            return {'success': False, 'message': str(e)}
    
    def _complete_payment(self, order, payment, razorpay_payment_data):
        """
        Mark payment as successful and save payment_id from Razorpay
        This is the KEY FIX - we get payment_id from Razorpay, not from callback
        """
        with transaction.atomic():
            # CRITICAL: Extract payment_id from Razorpay response
            razorpay_payment_id = razorpay_payment_data.get('id')  # pay_xxxxx
            
            # Save payment_id to database (this is what callback would have done)
            payment.gateway_payment_id = razorpay_payment_id
            payment.status = 'SUCCESS'
            payment.gateway_response = razorpay_payment_data
            payment.save(update_fields=['gateway_payment_id', 'status', 'gateway_response'])
            
            # Update order
            order.status= 'PENDING'
            if order.payment_method == 'UPI_ON_DELIVERY':
                order.payment_status = 'PARTIALLY_PAID'
            else:
                order.payment_status = 'PAID'

            order.transaction_id = razorpay_payment_id
            order.save(update_fields=['status','payment_status', 'transaction_id'])
            
            # Update tracking
            OrderTracking.objects.update_or_create(
                order=order,
                status=Order.OrderStatus.PENDING,
                defaults={
                    'completed': True,
                    'is_current': False,
                    'timestamp': timezone.now(),
                    'updated_from': 'SYSTEM',
                }
            )
            OrderTracking.objects.update_or_create(
                order=order,
                status=Order.OrderStatus.CONFIRMED,
                defaults={
                    "completed": False,
                    "is_current": True,
                    "timestamp": None,
                    "updated_from": 'SYSTEM',
                },
            )
            

            
            # Update user stats
            if hasattr(order.user, 'profile'):
                order.user.profile.increment_order_stats(order.total_amount)
            
            # Clear cart
            Cart.objects.filter(user=order.user, is_active=True).delete()
        
        return {
            'success': True, 
            'status': 'verified', 
            'order_id': order.id,
            'order_number': order.order_number,
            'payment_id': razorpay_payment_id
        }
    
    def _cancel_payment(self, order, payment, reason):
        """Mark payment as failed"""
        with transaction.atomic():
            payment.status = 'FAILED'
            payment.failure_reason = reason
            payment.save(update_fields=['status', 'failure_reason'])
            
            order.status = 'CANCELLED'
            order.payment_status = 'FAILED'
            order.save(update_fields=['status', 'payment_status'])
        
        return {
            'success': True,
            'status': 'cancelled',
            'order_id': order.id,
            'reason': reason
        }