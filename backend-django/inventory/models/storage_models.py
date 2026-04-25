from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import Point
from django.core.validators import MinValueValidator
from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal

class StorageLocation(models.Model):
    name = models.CharField(max_length=200, unique=True)
    location = models.TextField(help_text="Physical address")
    opening_time = models.TimeField(blank=True, null=True, help_text="Opening time (e.g., 09:00 AM)")
    closing_time = models.TimeField(blank=True, null=True, help_text="Closing time (e.g., 10:00 PM)")
    minimum_bargain_amount = models.DecimalField(max_digits=10,decimal_places=2,default=Decimal("0.00"),help_text="Minimum order amount required to enable AI bargaining.")
    minimum_pre_order_amount = models.DecimalField(max_digits=10,decimal_places=2,default=Decimal("0.00"),help_text="Minimum pre order amount required.")
    partial_pay_pre_order_percentage = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Pre order partial pay percentage")

    minimum_order_amount = models.DecimalField(max_digits=10,decimal_places=2,default=Decimal("0.00"),help_text="Minimum amount required to order")

    # NEW: COD limits
    min_cod_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("299.00"), help_text="Minimum order amount for Cash On Delivery")
    max_cod_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("1999.00"), help_text="Maximum order amount for Cash On Delivery")

      # NEW: slot step (minutes)
    slot_step_minutes = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(5), MaxValueValidator(24 * 60)],
        help_text="Gap between delivery slots in minutes (e.g., 30, 60).",)

    # NEW: day-level controls (so you can control from StorageLocation)
    today_slots_enabled = models.BooleanField(default=True)
    tomorrow_slots_enabled = models.BooleanField(default=True)

    # NEW: mark all slots full for a day (still visible but full)
    today_slots_full = models.BooleanField(default=False)
    tomorrow_slots_full = models.BooleanField(default=False)
    cutoff_minutes = models.PositiveIntegerField(default=0)

    # geospatial coordinate for this storage location
    point_lat = models.DecimalField(max_digits=35,decimal_places=30,blank=True,null=True,help_text="Latitude of this storage location",)
    point_long = models.DecimalField(max_digits=35,decimal_places=30,blank=True,null=True,help_text="Longitude of this storage location",)
    point = gis_models.PointField(srid=4326, null=True, blank=True, help_text="Lat/Lng of this storage location")
    capacity_kg = models.DecimalField(max_digits=10,decimal_places=2,validators=[MinValueValidator(0)],help_text="Maximum storage capacity in kilograms",)
    capacity_pieces = models.DecimalField(max_digits=10,decimal_places=2,default=0,validators=[MinValueValidator(0)],blank=True,null=True,help_text="Maximum storage capacity in pieces",)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Storage Location"
        verbose_name_plural = "Storage Locations"

    def save(self, *args, **kwargs):
        if self.point_lat is not None and self.point_long is not None:
            self.point = Point((self.point_long, self.point_lat), srid=4326)
        else:
            pass
        super().save(*args, **kwargs)

    def clean(self):
        if self.opening_time and self.closing_time:
            if self.opening_time >= self.closing_time:
                raise ValidationError("Closing time must be after opening time.")

    def __str__(self):
        return self.name
