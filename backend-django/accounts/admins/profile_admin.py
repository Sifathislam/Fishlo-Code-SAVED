# accounts/admins/profile_admin.py

# Packages Imports
from django.contrib import admin
from django.utils.html import format_html

# Local Imports
from ..models import UserProfile


# -------------------------
# User Profile Admin
# -------------------------
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = [
        "profile_image_preview",
        "user",
        "get_full_name",
        "total_orders",
        "total_spent",
        "phone_verified",
        "created_at",
    ]
    list_filter = ["phone_verified", "created_at", "updated_at"]
    search_fields = ["user__phone_number", "first_name", "last_name"]
    readonly_fields = [
        "user",
        "total_orders",
        "total_spent",
        "created_at",
        "updated_at",
        "profile_image_preview",
        "cover_image_preview",
    ]
    list_display_links = ["profile_image_preview", "user"]
    list_per_page = 25
    date_hierarchy = "created_at"

    fieldsets = (
        (
            "User Information",
            {"fields": ("user", "first_name", "last_name", "phone_verified")},
        ),
        ("Statistics", {"fields": ("total_orders", "total_spent")}),
        (
            "Images",
            {
                "fields": (
                    "profile_image",
                    "profile_image_preview",
                    "cover_image",
                    "cover_image_preview",
                )
            },
        ),
        ("User Grade", {"fields": ("is_vip", "is_blocked_for_abuse")}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def profile_image_preview(self, obj):
        if obj.profile_image:
            return format_html(
                '<img src="{}" width="50" height="50" style="border-radius: 50%;" />',
                obj.profile_image.url,
            )
        return "-"

    profile_image_preview.short_description = "Profile Image"

    def cover_image_preview(self, obj):
        if obj.cover_image:
            return format_html(
                '<img src="{}" width="150" height="50" style="object-fit: cover;" />',
                obj.cover_image.url,
            )
        return "-"

    cover_image_preview.short_description = "Cover Image"

    def get_full_name(self, obj):
        return obj.get_full_name()

    get_full_name.short_description = "Full Name"
