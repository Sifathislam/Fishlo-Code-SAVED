import hashlib
import hmac
from decimal import Decimal
from typing import Any, Dict, List

import razorpay
from django.conf import settings


class RazorpayGateway:
    """Razorpay payment gateway handler"""

    def __init__(self):
        self.client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )

    def create_order(
        self, amount: Decimal, currency: str, order_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create Razorpay order

        Args:
            amount: Order amount
            currency: Currency code (e.g., 'INR')
            order_data: Dict with order_number, order_id, user_email

        Returns:
            Dict with gateway_order_id, amount, currency, key_id, etc.
        """
        try:
            # Convert to paise (smallest currency unit)
            amount_in_paise = int(amount * 100)

            razorpay_order = self.client.order.create(
                {
                    "amount": amount_in_paise,
                    "currency": currency,
                    "receipt": order_data.get("order_number"),
                    "notes": {
                        "order_id": str(order_data.get("order_id")),
                        "user_email": order_data.get("user_email", ""),
                    },
                }
            )

            return {
                "gateway_order_id": razorpay_order["id"],
                "amount": razorpay_order["amount"],
                "currency": razorpay_order["currency"],
                "key_id": settings.RAZORPAY_KEY_ID,
                "receipt": razorpay_order["receipt"],
                "status": razorpay_order["status"],
            }
        except Exception as e:
            raise Exception(f"Razorpay order creation failed: {str(e)}")

    def verify_payment(self, payment_data: Dict[str, Any]) -> bool:
        """
        Verify Razorpay payment signature

        Args:
            payment_data: Dict with razorpay_order_id, razorpay_payment_id, razorpay_signature

        Returns:
            True if verified, False otherwise
        """
        try:
            razorpay_order_id = payment_data.get("razorpay_order_id")
            razorpay_payment_id = payment_data.get("razorpay_payment_id")
            razorpay_signature = payment_data.get("razorpay_signature")

            # Create signature
            message = f"{razorpay_order_id}|{razorpay_payment_id}"
            generated_signature = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode(), message.encode(), hashlib.sha256
            ).hexdigest()

            return hmac.compare_digest(generated_signature, razorpay_signature)
        except Exception:
            return False

    def get_payment_status(self, payment_id: str) -> str:
        """
        Get payment status from Razorpay using PAYMENT ID
        
        Args:
            payment_id: Razorpay payment ID (pay_xxxxx)
        
        Returns:
            Payment status: 'PAID', 'PENDING', 'FAILED', 'REFUNDED'
        """
        try:
            payment = self.client.payment.fetch(payment_id)

            status_mapping = {
                "authorized": "PENDING",
                "captured": "PAID",
                "refunded": "REFUNDED",
                "failed": "FAILED",
            }

            return status_mapping.get(payment["status"], "PENDING")
        except Exception as e:
            raise Exception(f"Failed to fetch payment status: {str(e)}")

    def get_order_payments(self, order_id: str) -> List[Dict[str, Any]]:
        """
        CRITICAL METHOD FOR RECONCILIATION 
        
        Get all payments associated with a Razorpay order.
        This works even if your callback URL was never called!
        
        When user pays and closes browser:
        - Your callback doesn't run 
        - But payment exists in Razorpay 
        - This method fetches it directly from Razorpay
        
        Args:
            order_id: Razorpay order ID (order_xxxxx)
        
        Returns:
            List of payment dictionaries, each containing:
            - id: Razorpay payment ID (pay_xxxxx)
            - status: 'authorized', 'captured', 'failed', etc.
            - amount: Amount in paise
            - created_at: Timestamp
            - And other payment details
        """
        try:
            # Razorpay API: Get all payments for this order
            # This is documented at: https://razorpay.com/docs/api/payments/
            payments_response = self.client.order.payments(order_id)
            
            # Response structure: {"entity": "collection", "count": 1, "items": [...]}
            if payments_response and 'items' in payments_response:
                return payments_response['items']
            
            # No payments found for this order
            return []
            
        except razorpay.errors.BadRequestError as e:
            # Order doesn't exist or invalid order_id
            raise Exception(f"Invalid order ID or order not found: {str(e)}")
        except Exception as e:
            # Other errors (network, authentication, etc.)
            raise Exception(f"Failed to fetch order payments: {str(e)}")
