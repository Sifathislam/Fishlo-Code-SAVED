# accounts/models/profile_models.py

import os

from django.db import models
from django.db.models import F
from django.utils import timezone

from PIL import Image

from .user_models import User


class UserProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="profile", primary_key=True
    )
    first_name = models.CharField(max_length=50, blank=True, db_index=True)
    last_name = models.CharField(max_length=50, blank=True, db_index=True)
    phone_verified = models.BooleanField(default=False)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_orders = models.PositiveIntegerField(default=0)
    profile_image = models.ImageField(upload_to="profiles/images/%Y/%m/", blank=True, null=True)
    cover_image = models.ImageField(upload_to="profiles/covers/%Y/%m/", blank=True, null=True)

    is_vip = models.BooleanField(default=False)
    is_blocked_for_abuse = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_profiles"
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["first_name", "last_name"]),
        ]

    def __str__(self):
        display_name = self.get_full_name() or str(self.user.phone_number)
        return f"{display_name}"

    def get_full_name(self):
        full_name = f"{self.first_name} {self.last_name}".strip()
        if full_name:
            return full_name
        return ""

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.profile_image:
            self._optimize_image(self.profile_image.path, max_size=(300, 300))
        if self.cover_image:
            self._optimize_image(self.cover_image.path, max_size=(1200, 400))

    def _optimize_image(self, image_path, max_size):
        try:
            if os.path.exists(image_path):
                img = Image.open(image_path)
                if img.mode in ("RGBA", "LA", "P"):
                    background = Image.new("RGB", img.size, (255, 255, 255))
                    if img.mode == "P":
                        img = img.convert("RGBA")
                    background.paste(
                        img, mask=img.split()[-1] if img.mode == "RGBA" else None
                    )
                    img = background
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
                img.save(image_path, optimize=True, quality=85)
        except Exception:
            pass

    def increment_order_stats(self, order_amount):
        UserProfile.objects.filter(pk=self.pk).update(
            total_orders=F("total_orders") + 1,
            total_spent=F("total_spent") + order_amount,
            updated_at=timezone.now(),
        )

    @property
    def email(self):
        return self.user.email
