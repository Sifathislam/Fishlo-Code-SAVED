# inventory/admins/delivery_slot_admin.py

from django.contrib import admin
from inventory.models.delivery_slot_models import DeliveryTimeSlot


@admin.register(DeliveryTimeSlot)
class DeliveryTimeSlotAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "storagelocation",
        "delivery_day",
        "start_time",
        "end_time",
        "cutoff_minutes",
        "is_active",
    )

    list_filter = (
        "storagelocation",
        "is_active",
    )

    search_fields = (
        "storagelocation__name",
    )

    ordering = (
        "storagelocation",
        "start_time",
    )

    readonly_fields = ("slot_label",)

    fieldsets = (
        ("Location", {
            "fields": ("storagelocation","delivery_day")
        }),
        ("Time Slot", {
            "fields": ("start_time", "end_time", "slot_label","is_full")
        }),
        ("Settings", {
            "fields": ("cutoff_minutes", "is_active")
        }),
    )

    def slot_label(self, obj):
        return obj.label()
    
    slot_label.short_description = "Slot Label"
