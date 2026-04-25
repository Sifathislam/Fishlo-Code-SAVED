from django.db import models


class Banner(models.Model):
    title = models.CharField(max_length=100, blank=True)  # optional human title
    left_side_image = models.ImageField(upload_to="banners/", null=True, blank=True)
    right_side_image = models.ImageField(upload_to="banners/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # show title if present, otherwise model id
        return self.title or f"BannerSlot:{self.id}"
