from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from .banner_models import Banner


class Offer(models.Model):
    slot = models.ForeignKey(Banner, on_delete=models.CASCADE, related_name="offers")
    left_side_offer_image = models.ImageField(
        upload_to="banners/offers/", null=True, blank=True
    )
    right_side_offer_image = models.ImageField(
        upload_to="banners/offers/", null=True, blank=True
    )

    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)  # null => no end
    active = models.BooleanField(default=True)  # manual enable/disable

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # order by priority then newest start (highest priority first)
        ordering = ["-start_date"]

    def clean(self):
        # ensure start <= end when end provided
        if self.end_date and self.start_date and self.start_date > self.end_date:
            raise ValidationError("start_date must be before or equal to end_date")

    def is_active(self, now=None):
        """Return True if offer is currently active based on dates and flag."""
        if not self.is_active_flag:
            return False
        if now is None:
            now = timezone.now()
        if self.start_date and self.start_date > now:
            return False
        if self.end_date and self.end_date < now:
            return False
        return True

    def __str__(self):
        return f"Offer(slot_id={self.slot_id}, id={self.id}"
