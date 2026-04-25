from decimal import Decimal
from typing import Any, Dict, Optional, List

from django.db import transaction

from .razorpay_gateway import RazorpayGateway


class PaymentService:
    """Service to handle Razorpay payment operations"""

    def __init__(self):
        self.gateway = RazorpayGateway()

    def create_payment_order(
        self, order_instance, currency: str = "INR", amount: Optional[Decimal] = None
    ) -> Dict[str, Any]:
        """
        Create payment order in Razorpay

        Args:
            order_instance: Order model instance
            currency: Currency code (default: INR)
            amount: Custom payment amount (optional, defaults to order total_amount)
                    Use this for partial payments (e.g., ₹5 for UPI orders)

        Returns:
            Dict with gateway order details
        """
        order_data = {
            "order_id": order_instance.id,
            "order_number": order_instance.order_number,
            "user_email": (
                order_instance.user.email if order_instance.user.email else ""
            ),
        }

        # Use custom amount if provided, otherwise use order total_amount
        payment_amount = amount if amount is not None else order_instance.total_amount

        return self.gateway.create_order(
            amount=payment_amount, currency=currency, order_data=order_data
        )

    def verify_and_update_payment(
        self, order_instance, payment_data: Dict[str, Any]
    ) -> bool:
        """
        Verify payment and update order

        Args:
            order_instance: Order model instance
            payment_data: Payment response from Razorpay

        Returns:
            True if verified successfully
        """
        is_verified = self.gateway.verify_payment(payment_data)

        if is_verified:
            with transaction.atomic():
                # Check if this is a partial payment (UPI case)
                if (
                    order_instance.payment_method == "UPI"
                    and order_instance.partial_pay > 0
                ):
                    # For UPI, mark as partially paid
                    order_instance.payment_status = (
                        "PARTIALLY_PAID"  # Initial payment done
                    )
                    #  order_instance.status = "CONFIRMED"
                    # order_instance.status = "PENDING"
                else:
                    # Full payment
                    order_instance.payment_status = "PAID"
                    # order_instance.status = "CONFIRMED"
                    # order_instance.status = "PENDING"

                order_instance.transaction_id = payment_data.get(
                    "razorpay_payment_id", ""
                )
                order_instance.save()

        return is_verified

    def get_payments_for_order(self, order_id: str) -> List[Dict[str, Any]]:
        """
        Get all payments for a Razorpay order.
        
        This is the KEY METHOD for reconciliation!
        Even if callback didn't run, we can fetch payments directly from Razorpay.
        
        Args:
            order_id: Razorpay order ID (order_xxxxx)
        
        Returns:
            List of payment dictionaries with full payment details
            Each payment has: id, status, amount, created_at, etc.
        """
        return self.gateway.get_order_payments(order_id)

    def check_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """
        Check payment status from Razorpay using PAYMENT ID
        Only use this if you already have the payment_id saved.
        
        Args:
            payment_id: Razorpay payment ID (pay_xxxxx)
        
        Returns:
            Dict with status and payment details
        """
        try:
            status = self.gateway.get_payment_status(payment_id)
            return {
                'status': status,
                'id': payment_id,
                'type': 'payment'
            }
        except Exception as e:
            raise Exception(f"Failed to check payment status: {str(e)}")

