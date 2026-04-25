from django.db import transaction
from django.utils import timezone

from orders.models.orders_models import Order, OrderAddress, OrderTracking,OrderItem
from orders.models.cart_models import Cart

from .payment_service import PaymentService
from orders.selectors.cart_selectors import get_inventory
from decimal import Decimal
from orders.utils.email_service import notify_admin_new_order

class OrderPaymentService:
    def verify_payment_and_finalize_order(self, *,request, user, order, payment, payment_data):
        """
        Contains all the write/business logic from VerifyPaymentView
        (same behavior, moved out of view)
        """
        with transaction.atomic():
            payment_service = PaymentService()
            is_verified = payment_service.verify_and_update_payment(order, payment_data)

            if is_verified:
                payment.mark_as_success(
                    gateway_payment_id=payment_data.get("razorpay_payment_id"),
                    gateway_response=payment_data,
                )

                if order.payment_method == "UPI_ON_DELIVERY":
                    order.payment_status = "PARTIALLY_PAID"
                    order.save(update_fields=["payment_status"])
                else:
                    order.payment_status = "PAID"
                    order.save(update_fields=["payment_status"])

                OrderTracking.objects.update_or_create(
                    order=order,
                    status=Order.OrderStatus.PENDING,
                    defaults={
                        "completed": True,
                        "is_current": False,
                        "timestamp": timezone.now(),
                        "updated_from": "SYSTEM",
                    },
                )
                OrderTracking.objects.update_or_create(
                    order=order,
                    status=Order.OrderStatus.CONFIRMED,
                    defaults={
                        "completed": False,
                        "is_current": True,
                        "timestamp": None,
                        "updated_from": "SYSTEM",
                    },
                )

                order_address = OrderAddress.objects.get(order=order)
                order_address_pointer = order_address.point 
                orderItems = OrderItem.objects.filter(order=order)
                for  item in orderItems:
                    product_inventory = get_inventory(request, item.product) 
                    if item.product.sell_type == 'WEIGHT':
                        # item_order_total_weight = Decimal(item.weight_in_kg * item.quantity)
                        # item_order_total_weight = Decimal(item.weight) 
                        # product_inventory.stock_kg-=item_order_total_weight
                        
                        # Weight stock is intentionally NOT deducted at payment time.
                        # It is deducted later when the store staff enters the actual
                        # measured weight during the PROCESSING status change.
                        pass
                    else:
                        product_inventory.stock_pieces-=Decimal(item.quantity)
                    product_inventory.save(skip_history=True)
                    
                user.profile.increment_order_stats(order.total_amount)
                
                notify_admin_new_order(order)
                Cart.objects.filter(user=user, is_active=True).delete()

                return True

            payment.mark_as_failed(
                reason="Payment verification failed",
                gateway_response=payment_data,
            )
            return False

    def mark_payment_failed_with_exception(self, *, payment, error_message):
        payment.mark_as_failed(
            reason=f"Payment verification error: {error_message}",
            gateway_response={"error": error_message},
        )