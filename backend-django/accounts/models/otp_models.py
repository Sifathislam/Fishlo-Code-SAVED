# accounts/models/otp_models.py

from datetime import timedelta

from django.db import models
from django.utils import timezone

from phonenumber_field.modelfields import PhoneNumberField


class OTP(models.Model):
    phone_number = PhoneNumberField(region="IN")
    session_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = "OTP"
        verbose_name_plural = "OTPs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.phone_number} "

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=5)


class OTPAttempt(models.Model):
    ATTEMPT_TYPES = [
        ("send", "Send OTP"),
        ("verify", "Verify OTP"),
    ]

    STATUS_CHOICES = [
        ("success", "Success"),
        ("failed", "Failed"),
        ("blocked", "Rate Limited"),
    ]

    phone_number = PhoneNumberField(region="IN")
    attempt_type = models.CharField(max_length=10, choices=ATTEMPT_TYPES, db_index=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, db_index=True)
    attempted_at = models.DateTimeField(default=timezone.now, db_index=True)
    error_message = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ["-attempted_at"]
        indexes = [
            models.Index(fields=["phone_number", "attempt_type", "-attempted_at"]),
            models.Index(fields=["status", "-attempted_at"]),
        ]
        verbose_name = "OTP Attempt"
        verbose_name_plural = "OTP Attempts"

    def __str__(self):
        return f"{self.phone_number} - {self.attempt_type} - {self.status} - {self.attempted_at}"
