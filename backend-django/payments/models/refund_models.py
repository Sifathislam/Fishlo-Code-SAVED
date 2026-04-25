from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from accounts.models import User
from orders.models import orders_models

from .payment_models import Payment


# ---------------
# REFUND MODEL
# ---------------
class Refund(models.Model):
    """Store refund transactions"""

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("PROCESSING", "Processing"),
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
        ("CANCELLED", "Cancelled"),
    ]

    REFUND_TYPE = [
        ("FULL_REFUND", "Full Refund"),
        ("PARTIAL_REFUND", "Partial Refund"),
        ("NO_REFUND", "No Refund"),
    ]

    # Core fields
    payment = models.ForeignKey(Payment, on_delete=models.PROTECT, related_name="refunds")
    order = models.ForeignKey(orders_models.Order, on_delete=models.PROTECT, related_name="refunds")
    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name="refunds")

    # Refund details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING", db_index=True)
    refund_type = models.CharField(max_length=30, choices=REFUND_TYPE)
    reason = models.TextField(null=True, blank=True)

    # Gateway specific
    gateway_refund_id = models.CharField(max_length=255,unique=True,null=True,blank=True,help_text="Refund ID from gateway",)
    gateway_response = models.JSONField(default=dict, blank=True)

    # Processing
    processed_by = models.ForeignKey(User,on_delete=models.SET_NULL,null=True,blank=True,related_name="processed_refunds",)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["payment", "status"]),
            models.Index(fields=["order", "-created_at"]),
        ]

    def __str__(self):
        return (
            f"Refund {self.gateway_refund_id or self.id} - "
            f"{self.order.order_number} - ₹{self.amount}"
        )

    def clean(self):
        """Validate refund amount"""
        if self.amount <= 0:
            raise ValidationError("Refund amount must be greater than 0")

        if self.payment_id:
            refundable = self.payment.get_refundable_amount()
            if self.amount > refundable:
                raise ValidationError(f"Refund amount cannot exceed ₹{refundable}")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

        # Update payment refund status
        if self.status == "SUCCESS":
            total_refunded = self.payment.get_refunded_amount()
            if total_refunded >= self.payment.amount:
                self.payment.status = "REFUNDED"
            self.payment.save(update_fields=["status", "updated_at"])

            # Update order payment status
            self.order.payment_status = "REFUNDED"
            self.order.save(update_fields=["payment_status", "updated_at"])

    def mark_as_success(self, gateway_refund_id=None, gateway_response=None):
        """Mark refund as successful"""
        self.status = "SUCCESS"
        self.processed_at = timezone.now()
        if gateway_refund_id:
            self.gateway_refund_id = gateway_refund_id
        if gateway_response:
            self.gateway_response = gateway_response
        self.save()

    def mark_as_failed(self, gateway_response=None):
        """Mark refund as failed"""
        self.status = "FAILED"
        if gateway_response:
            self.gateway_response = gateway_response
        self.save()
