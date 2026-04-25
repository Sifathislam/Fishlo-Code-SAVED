# models.py
import secrets
from django.db import models
from django.utils import timezone
from .orders_models import Order
class ReceiptShareLink(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="receipt_links")
    receipt_file = models.FileField(upload_to="receipts/", null=True, blank=True)
    short_code = models.CharField(max_length=20, unique=True, db_index=True)
    phone = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)
    click_count = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_clicked_at = models.DateTimeField(null=True, blank=True)

    def is_expired(self):
        return self.expires_at and timezone.now() > self.expires_at

    @classmethod
    def generate_code(cls, length=6):
        while True:
            code = secrets.token_urlsafe(length)[:length]
            if not cls.objects.filter(short_code=code).exists():
                return code