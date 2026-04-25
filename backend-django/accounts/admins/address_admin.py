# accounts/admins/address_admin.py

# Packages Imports
from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

# Local Imports
from ..models import UserAddress


# -------------------------
# User Address Inline
# -------------------------
class UserAddressInline(admin.TabularInline):
    model = UserAddress
    extra = 0
    fields = [
        "address_type",
        "house_details",
        "city",
        "state",
        "postal_code",
        "is_default",
        "is_active",
    ]
    readonly_fields = []
    can_delete = True


# --------------------
# User Address Admin
# --------------------
@admin.register(UserAddress)
class UserAddressAdmin(GISModelAdmin):
    wkt_field = "point"
    default_zoom = 12
    list_display = [
        "user",
        "session_key",
        "address_type",
        "city",
        "state",
        "country",
        "postal_code",
        "is_default",
        "is_active",
        "updated_at",
    ]
    list_filter = [
        "address_type",
        "is_default",
        "is_active",
        "country",
        "state",
        "city",
    ]
    search_fields = [
        "user__phone_number",
        "user__email",
        "house_details",
        "city",
        "state",
        "postal_code",
        "session_key",
    ]
    readonly_fields = ["created_at", "updated_at"]
    list_per_page = 25
    date_hierarchy = "created_at"
    # list_editable = ["is_default", "is_active"]

    fieldsets = (
        ("User", {"fields": ("user", "session_key")}),
        (
            "Address Details",
            {
                "fields": (
                    "address_type",
                    "house_details",
                    "address_line_2",
                    "city",
                    "state",
                    "country",
                    "postal_code",
                    "longitude",
                    "latitude",
                    "point",
                )
            },
        ),
        ("Settings", {"fields": ("is_default", "is_active")}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    actions = ["mark_as_default", "mark_as_active", "mark_as_inactive"]

    def mark_as_default(self, request, queryset):
        for address in queryset:
            address.is_default = True
            address.save()
        self.message_user(request, f"{queryset.count()} address(es) marked as default.")

    mark_as_default.short_description = "Mark selected as default"

    def mark_as_active(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} address(es) marked as active.")

    mark_as_active.short_description = "Mark selected as active"

    def mark_as_inactive(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} address(es) marked as inactive.")

    mark_as_inactive.short_description = "Mark selected as inactive"
