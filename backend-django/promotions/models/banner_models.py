from django.db import models
from time import timezone

class Banner(models.Model):
    PLACEMENT_CHOICES = [
        ("HOME_TOP_BANNER", "Home - Top Banner"),
        ("HOME_MIDDLE_BANNER", "Home - Middle Banner"),
        ("HOME_BOTTOM_BANNER", "Home - Bottom Banner"),
        ("PLP_TOP_BANNER", "Product List - Top Banner"),
        ("PLP_BETWEEN_ROWS", "Product List - Between Rows"),
        ("CART_TOP_BANNER", "Cart - Top Banner"),
        ("CART_BOTTOM_BANNER", "Cart - Bottom Banner"),
        ("HOME_POPUP", "Home - Popup"),
        ("BARGAIN_PROMO", "Bargain Feature Promo"),
    ]

    title = models.CharField(max_length=200, blank=True)
    placement = models.CharField(max_length=50, choices=PLACEMENT_CHOICES)
    image_desktop = models.ImageField(upload_to="banners/%Y/%m/")  # optional: organised folders
    image_mobile = models.ImageField(
        upload_to="banners/mobile/%Y/%m/",
        null=True,
        blank=True,
    )

    link_url = models.URLField(blank=True, null=True)

    priority = models.IntegerField(default=100)  # lower = more important
    is_active = models.BooleanField(default=True)

    starts_at = models.DateTimeField(blank=True, null=True)
    ends_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["placement", "priority", "-starts_at"]
        indexes = [
            models.Index(fields=["placement"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["starts_at", "ends_at"]),
        ]

    def __str__(self):
        return f"{self.placement} - {self.title or self.id}"

    def is_currently_active(self):
        now = timezone.now()
        if not self.is_active:
            return False
        if self.starts_at and self.starts_at > now:
            return False
        if self.ends_at and self.ends_at < now:
            return False
        return True