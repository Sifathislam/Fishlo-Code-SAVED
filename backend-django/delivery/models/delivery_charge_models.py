from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import models
from inventory.models.storage_models import StorageLocation
from django.core.exceptions import ValidationError
from django.core.exceptions import ObjectDoesNotExist

class DeliveryChargeModel(models.Model):
    CHARGE_TYPE_CHOICES = [
        ("FREE", "Free"),
        ("PAID", "Paid"),
    ]

    storagelocation = models.ForeignKey(StorageLocation,on_delete=models.CASCADE,related_name="delivery_charge_rules",)

    # Distance range in KM
    min_distance_km = models.DecimalField(max_digits=6, decimal_places=2)  # ex: 5.00
    max_distance_km = models.DecimalField(max_digits=6, decimal_places=2)  # ex: 10.00

    charge_type = models.CharField(max_length=10, choices=CHARGE_TYPE_CHOICES, default="PAID")

    # Only used when charge_type == PAID
    charge_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["storagelocation", "min_distance_km"]
        indexes = [
            models.Index(fields=["storagelocation", "is_active"]),
            models.Index(fields=["storagelocation", "min_distance_km", "max_distance_km"]),
        ]


    def clean(self):
        # basic validations
        if self.min_distance_km is None or self.max_distance_km is None:
            raise ValidationError("Distance range is required.")

        if self.min_distance_km < 0 or self.max_distance_km < 0:
            raise ValidationError("Distance cannot be negative.")

        if self.max_distance_km <= self.min_distance_km:
            raise ValidationError("Max distance must be greater than min distance.")

        # charge validations
        if self.charge_type == "FREE":
            self.charge_amount = Decimal("0.00")

        if self.charge_type == "PAID" and self.charge_amount < 0:
            raise ValidationError("Charge amount cannot be negative.")

        #IMPORTANT: storagelocation might not be set yet in admin add
        if not self.storagelocation_id:
            return  # skip overlap check until FK is provided

        #Overlap validation (use storagelocation_id, not storagelocation)
        overlapping = self.__class__.objects.filter(
            storagelocation_id=self.storagelocation_id,
            is_active=True,
            min_distance_km__lt=self.max_distance_km,
            max_distance_km__gt=self.min_distance_km,
        ).exclude(pk=self.pk)

        if overlapping.exists():
            raise ValidationError({"min_distance_km": "This distance range overlaps with an existing rule."})


    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.storagelocation if self.storagelocation else ''} | {self.min_distance_km}-{self.max_distance_km} km | {self.charge_type} {self.charge_amount}"
