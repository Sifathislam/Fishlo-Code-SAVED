# accounts/admins/otp_admin.py

# Packages Imports
from django.contrib import admin

# Local Imports
from ..models import OTP, OTPAttempt


# -----------------
# OTP Admin Class
# -----------------
@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = [
        "phone_number",
        "session_id",
        "is_verified",
        "created_at",
        "verified_at",
    ]
    list_filter = ["is_verified", "created_at"]
    search_fields = ["phone_number", "session_id"]
    readonly_fields = ["created_at", "verified_at"]
    ordering = ["-created_at"]


# ---------------------------
# User OTPAttemptAdmin Class
# ---------------------------
@admin.register(OTPAttempt)
class OTPAttemptAdmin(admin.ModelAdmin):
    list_display = ["phone_number", "attempt_type", "status", "attempted_at"]
    list_filter = ["attempt_type", "status", "attempted_at"]
    search_fields = ["phone_number"]
    readonly_fields = [
        "phone_number",
        "attempt_type",
        "status",
        "attempted_at",
        "error_message",
    ]
    date_hierarchy = "attempted_at"

    def has_add_permission(self, request):
        return False  # Can't manually add attempts

    def has_change_permission(self, request, obj=None):
        return False  # Can't edit attempts
