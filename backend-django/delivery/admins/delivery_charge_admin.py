# inventory/admins/delivery_charge_admin.py

from django.contrib import admin
from ..models.delivery_charge_models import DeliveryChargeModel


@admin.register(DeliveryChargeModel)
class DeliveryChargeModelAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "storagelocation",
        "distance_range",
        "charge_type",
        "charge_amount",
        "is_active",
        "created_at",
    )

    list_filter = (
        "storagelocation",
        "charge_type",
        "is_active",
    )

    search_fields = (
        "storagelocation__name",
    )

    ordering = ("storagelocation", "min_distance_km")

    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Storage Location", {
            "fields": ("storagelocation",),
        }),
        ("Distance Range (KM)", {
            "fields": ("min_distance_km", "max_distance_km"),
        }),
        ("Charge Settings", {
            "fields": ("charge_type", "charge_amount", "is_active"),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
        }),
    )

    # show "5 - 10 KM" nicely in list
    def distance_range(self, obj):
        return f"{obj.min_distance_km} KM → {obj.max_distance_km} KM"

    distance_range.short_description = "Distance Range"
