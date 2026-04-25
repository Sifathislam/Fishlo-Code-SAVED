from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone

from ..models import Banner


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    class Media:
        js = ("admin/js/banner_preview.js",)
    list_display = (
        "id",
        "desktop_preview",
        "mobile_preview",
        "title",
        "placement",
        "priority",
        "is_active",
        "starts_at",
        "ends_at",
    )

    list_filter = ("placement", "is_active")
    search_fields = ("title", "placement")
    ordering = ("placement", "priority")

    readonly_fields = (
        "desktop_preview_large",
        "mobile_preview_large",
        "created_at",
    )

    fieldsets = (
        ("Basic Info", {
            "fields": ("title", "placement", "priority", "is_active")
        }),

        ("Images", {
            "fields": (
                "image_desktop",
                "desktop_preview_large",
                "image_mobile",
                "mobile_preview_large",
            )
        }),

        ("Redirect", {
            "fields": ("link_url",)
        }),

        ("Schedule", {
            "fields": ("starts_at", "ends_at")
        }),

        ("Metadata", {
            "fields": ("created_at",),
        }),
    )

    # -------------------------
    # Image Preview (List View)
    # -------------------------
    def desktop_preview(self, obj):
        if obj.image_desktop:
            return format_html(
                '<img src="{}" width="80" style="border-radius:5px;" />',
                obj.image_desktop.url
            )
        return "-"
    desktop_preview.short_description = "Desktop"

    def mobile_preview(self, obj):
        if obj.image_mobile:
            return format_html(
                '<img src="{}" width="60" style="border-radius:5px;" />',
                obj.image_mobile.url
            )
        return "-"
    mobile_preview.short_description = "Mobile"

    # -------------------------
    # Large Preview (Detail)
    # -------------------------
    def desktop_preview_large(self, obj):
        if obj.image_desktop:
            return format_html(
                '<img src="{}" width="300" style="border-radius:10px;" />',
                obj.image_desktop.url
            )
        return "No Image"
    desktop_preview_large.short_description = "Desktop Preview"

    def mobile_preview_large(self, obj):
        if obj.image_mobile:
            return format_html(
                '<img src="{}" width="200" style="border-radius:10px;" />',
                obj.image_mobile.url
            )
        return "No Image"
    mobile_preview_large.short_description = "Mobile Preview"

    # -------------------------
    # Save Logic (Auto Handling)
    # -------------------------
    def save_model(self, request, obj, form, change):
        # Auto-disable expired banners
        if obj.ends_at and obj.ends_at < timezone.now():
            obj.is_active = False

        super().save_model(request, obj, form, change)

    # -------------------------
    # Validation (Bulletproof)
    # -------------------------
    def clean(self):
        if self.starts_at and self.ends_at:
            if self.starts_at > self.ends_at:
                raise ValueError("Start date cannot be after end date.")