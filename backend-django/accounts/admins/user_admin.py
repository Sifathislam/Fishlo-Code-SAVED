# accounts/admins/user_admin.py

# Packages Imports
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

# Local Imports
from ..models import User


# -----------------
# User Admin Class
# -----------------
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        "phone_number",
        "role",
        "is_active",
        "is_staff",
        "is_superuser",
        "date_joined",
    ]
    list_filter = ["role", "is_active", "is_staff", "is_superuser", "date_joined"]
    search_fields = ["phone_number", "email","role"]
    ordering = ["-date_joined"]
    readonly_fields = ["date_joined", "last_login", "uuid"]

    fieldsets = (
        (None, {"fields": ("phone_number", "email", "password", "role")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "phone_number",
                    "email",
                    "role",
                    "password1",
                    "password2",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
    )
