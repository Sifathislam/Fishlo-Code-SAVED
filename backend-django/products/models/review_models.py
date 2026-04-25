from django.db import models

from accounts.models import User
from .product_models import Product


# --------------
# REVIEW Model
# --------------
class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name="reviews")
    product = models.ForeignKey(
        Product, on_delete=models.PROTECT, related_name="reviews"
    )
    comment = models.TextField()
    star = models.PositiveSmallIntegerField(default=1, help_text="Rating between 1-5")
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.product.name} ({self.star}★)"


class StockNotifyRequest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey("Product", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "product")

    def __str__(self):
        return f"{self.user} requested notify for {self.product}"


class RecentlyViewed(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="recently_viewed",
        null=True,
        blank=True,
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="recent_views"
    )
    viewed_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        ordering = ["-viewed_at"]
        indexes = [
            models.Index(fields=["user", "-viewed_at"]),
            models.Index(fields=["-viewed_at"]),
            models.Index(fields=["viewed_at"]),  # For cleanup tasks
        ]
        # Prevent duplicate entries
        constraints = [
            models.UniqueConstraint(
                fields=["user", "product"],
                condition=models.Q(user__isnull=False),
                name="unique_user_product",
            ),
        ]

    def __str__(self):
        if self.user:
            return f"{self.user.email} viewed {self.product.name}"
