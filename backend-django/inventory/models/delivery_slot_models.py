# inventory/models/delivery_slot_models.py

from django.db import models
from django.core.exceptions import ValidationError
from inventory.models.storage_models import StorageLocation
from delivery.utils.slot_format import slot_label

# inventory/models/delivery_slot_models.py
class DeliveryTimeSlot(models.Model):
    """
    Time range like 09am-10am, 10:30am-11am.
    Same slots are used every day (today/tomorrow).
    """
    DELIVERY_DAY_CHOICES = [
        ("TODAY", "Today"),
        ("TOMORROW", "Tomorrow")]
       
    storagelocation = models.ForeignKey(StorageLocation,on_delete=models.CASCADE,related_name="delivery_slots")
    delivery_day = models.CharField(max_length=10,choices=DELIVERY_DAY_CHOICES, default='TODAY')
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)
    cutoff_minutes = models.PositiveIntegerField(default=0)
    is_full = models.BooleanField(default=False)
    

    class Meta:
        ordering = ["storagelocation", "start_time"]
        constraints = [
            models.UniqueConstraint(
                fields=["storagelocation","delivery_day","start_time", "end_time"],
                name="unique_slot_per_location",
            )
        ]

    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError("End time must be after start time.")

    def label(self):
        return f"{slot_label(self.start_time,self.end_time)}"

    def __str__(self):
        return f"{self.storagelocation.name} {self.label()}"
