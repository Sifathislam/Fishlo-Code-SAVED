from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models

from accounts.models import UserProfile
from inventory.models import StorageLocation
from inventory.models.inventory_models import Inventory
from products.models.product_models import Product

User = get_user_model()


class ChatSession(models.Model):
    ROLE_ANDROID = "ANDROID"
    ROLE_IOS = "IOS"
    ROLE_WEB = "WEB"

    DEVICE_CHOICES = [
        (ROLE_ANDROID, "Android"),
        (ROLE_IOS, "iOS"),
        (ROLE_WEB, "Web"),
    ]

    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="chat_sessions")
    storage_location = models.ForeignKey(StorageLocation, on_delete=models.CASCADE, null=True, blank=True, related_name="chat_sessions")

    device_type = models.CharField(max_length=20, choices=DEVICE_CHOICES, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    message_count = models.PositiveIntegerField(default=0)

    cart_snapshot = models.JSONField(null=True, blank=True)
    cart_total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)


    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"ChatSession #{self.id} - {self.user_profile.user.phone_number}"


class ChatMessage(models.Model):
    ROLE_USER = "USER"
    ROLE_AGENT = "AGENT"
    ROLE_SYSTEM = "SYSTEM"

    ROLE_CHOICES = [
        (ROLE_USER, "User"),
        (ROLE_AGENT, "Fisherwoman"),
        (ROLE_SYSTEM, "System"),
    ]

    session = models.ForeignKey(
        ChatSession, on_delete=models.CASCADE, related_name="messages"
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    text = models.JSONField()

    created_at = models.DateTimeField(auto_now_add=True)

    # for future use – keep them blank for now
    language = models.CharField(max_length=20, blank=True)
    sentiment = models.CharField(max_length=20, blank=True)
    intent = models.CharField(max_length=50, blank=True)
    is_abusive = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.role} @ {self.created_at}"


class AIPrompt(models.Model):
    key = models.CharField(max_length=100, unique=True)
    content = models.TextField()
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.key


class StockReservation(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        RELEASED = "RELEASED", "Released"
        CONSUMED = "CONSUMED", "Consumed"  # order placed successfully
        EXPIRED = "EXPIRED", "Expired"

    inventory = models.ForeignKey(
        "inventory.Inventory", on_delete=models.CASCADE, related_name="reservations"
    )
    chat_session = models.ForeignKey(
        "ChatSession", on_delete=models.CASCADE, related_name="stock_reservations"
    )
    qty_kg = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    qty_pieces = models.PositiveIntegerField(default=0, null=True, blank=True)
    agreed_unit_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.ACTIVE, db_index=True
    )
    expires_at = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "expires_at"]),
        ]

    def clean(self):
        # Must reserve something
        has_kg = self.qty_kg is not None and self.qty_kg > 0
        has_pieces = self.qty_pieces is not None and self.qty_pieces > 0

        if not has_kg and not has_pieces:
            raise ValidationError("Either qty_kg or qty_pieces must be provided.")

        # Prevent mixed-unit reservations unless you explicitly want it
        if has_kg and has_pieces:
            raise ValidationError("Only one of qty_kg or qty_pieces should be set.")
