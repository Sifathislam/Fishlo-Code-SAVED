from decimal import Decimal

from django.db import models
from django.utils import timezone

from accounts.models import User
from orders.models import orders_models


# ---------------
# PAYMENT MODEL
# ---------------
class Payment(models.Model):
    """Store all payment transactions"""

    PAYMENT_METHOD_CHOICES = [
        ("RAZORPAY", "Razorpay"),
        ("UPI_ON_DELIVERY", "UPI_ON_DELIVERY"),
        ("COD", "Cash On Delivery"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
        ("REFUNDED", "Refunded"),
        ("CANCELLED", "Cancelled"),
    ]

    # Core fields
    order = models.ForeignKey(
        orders_models.Order, on_delete=models.PROTECT, related_name="payments"
    )
    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name="payments")

    # Payment details
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="PENDING", db_index=True
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="INR")

    # Gateway specific fields
    gateway_payment_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        help_text="Payment ID from gateway (e.g., Razorpay)",
    )
    gateway_order_id = models.CharField(
        max_length=255, null=True, blank=True, help_text="Order ID from gateway"
    )
    gateway_signature = models.CharField(
        max_length=500,
        null=True,
        blank=True,
        help_text="Payment signature for verification",
    )

    # Response data from gateway
    gateway_response = models.JSONField(
        default=dict, blank=True, help_text="Full response from payment gateway"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(
        null=True, blank=True, help_text="When payment was successful"
    )

    # Additional info
    failure_reason = models.TextField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["order", "status"]),
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["gateway_payment_id"]),
        ]

    def __str__(self):
        return (
            f"Payment {self.gateway_payment_id or self.id} - "
            f"{self.order.order_number} - {self.status}"
        )

    def mark_as_success(self, gateway_payment_id=None, gateway_response=None):
        """Mark payment as successful"""
        self.status = "SUCCESS"
        self.paid_at = timezone.now()
        if gateway_payment_id:
            self.gateway_payment_id = gateway_payment_id
        if gateway_response:
            razorpay_order_id = gateway_response.get("razorpay_order_id", "")
            razorpay_payment_id = gateway_response.get("razorpay_payment_id", "")
            razorpay_signature = gateway_response.get("razorpay_signature", "")

            self.gateway_response = gateway_response
            self.gateway_order_id = razorpay_order_id
            self.gateway_payment_id = razorpay_payment_id
            self.gateway_signature = razorpay_signature
        self.save()

        # Update order payment status
        if self.order.payment_method == "UPI_ON_DELIVERY":
            self.order.payment_status = "PARTIALLY_PAID"
        else:
            self.order.payment_status = "PAID"
        self.order.transaction_id = gateway_payment_id
        self.order.save(update_fields=["payment_status", "transaction_id", "updated_at"])

    def mark_as_failed(self, reason=None, gateway_response=None):
        """Mark payment as failed"""
        self.status = "FAILED"
        self.failure_reason = reason
        if gateway_response:
            self.gateway_response = gateway_response
        self.save()

        # Update order payment status
        self.order.payment_status = "FAILED"
        self.order.save(update_fields=["payment_status", "updated_at"])

    def can_refund(self):
        """Check if payment can be refunded"""
        return self.status in ["SUCCESS"] and self.amount > 0

    def get_refunded_amount(self):
        """Get total refunded amount"""
        return self.refunds.filter(status="SUCCESS").aggregate(total=models.Sum("amount"))[
            "total"
        ] or Decimal("0.00")

    def get_refundable_amount(self):
        """Get remaining amount that can be refunded"""
        return self.amount - self.get_refunded_amount()
