# accounts/models/address_models.py

from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import Point
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models

from .user_models import User


class UserAddress(models.Model):
    ADDRESS_TYPE_CHOICES = [("home", "Home"), ("office", "Office"), ("other", "Other")]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses", null=True, blank=True)
    session_key = models.CharField(max_length=255, null=True, blank=True, help_text="For guest users")
    address_type = models.CharField(max_length=10, choices=ADDRESS_TYPE_CHOICES, null=True, blank=True)
    address_type_other = models.CharField(max_length=50,null=True,blank=True,help_text="Specify if address type is 'Other' (e.g., Friend's House)",)
    recipient_name = models.CharField(max_length=200,null=True,blank=True,help_text="Name of the person who will receive the delivery ",)
    recipient_phone = models.CharField(max_length=20, null=True, blank=True)
    house_details = models.CharField(max_length=255,null=True,blank=True,help_text="Flat, House no., Building, Company, Apartment",)
    address_line_2 = models.CharField(max_length=255, null=True, blank=True)
    landmark = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=100, db_index=True, null=True, blank=True)
    state = models.CharField(max_length=100, db_index=True)
    country = models.CharField(max_length=100, default="India", db_index=True)
    postal_code = models.CharField(max_length=20,validators=[RegexValidator(regex=r"^\d{4,10}$", message="Postal code must be 4-10 digits")],null=True,blank=True,)
    latitude = models.DecimalField(max_digits=35,decimal_places=30,blank=True,null=True,help_text="Latitude (e.g., 23.8103)",)
    longitude = models.DecimalField(max_digits=35,decimal_places=30,blank=True,null=True,help_text="Longitude (e.g., 90.4125)",)
    point = gis_models.PointField(srid=4326,null=True,blank=True,help_text="Lat/Lng of this useraddress location",)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "user_addresses"
        verbose_name = "User Address"
        verbose_name_plural = "User Addresses"
        ordering = ["-is_default", "-updated_at"]
        indexes = [
            models.Index(fields=["user", "is_default"]),
            models.Index(fields=["user", "is_active"]),
        ]

    def __str__(self):
        return f"{self.get_address_type_display()} - {self.city}, {self.state}"


    def save(self, *args, **kwargs):
        self.clean()
        if self.is_default:
            UserAddress.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(
                is_default=False
            )
        if not self.pk and not UserAddress.objects.filter(user=self.user).exists():
            self.is_default = True

        if self.latitude is not None and self.longitude is not None:
            try:
                lat = float(self.latitude)
                lon = float(self.longitude)

                if not (-90 <= lat <= 90):
                    raise ValidationError(f"Latitude {lat} out of range (-90 to 90).")
                if not (-180 <= lon <= 180):
                    raise ValidationError(f"Longitude {lon} out of range (-180 to 180).")

                self.point = Point(lon, lat, srid=4326)
            except (ValueError, TypeError) as e:
                raise ValidationError(f"Invalid latitude/longitude value: {e}")
        else:
            self.point = None

        super().save(*args, **kwargs)

    def get_full_address(self):
        parts = [
            self.house_details,
            self.address_line_2,
            self.city,
            self.state,
            self.country,
            self.postal_code,
        ]
        return ", ".join(filter(None, parts))

    def soft_delete(self):
        self.is_active = False
        self.is_default = False
        self.save(update_fields=["is_active", "is_default", "updated_at"])
        if not UserAddress.objects.filter(user=self.user, is_default=True, is_active=True).exists():
            first_active = UserAddress.objects.filter(user=self.user, is_active=True).first()
            if first_active:
                first_active.is_default = True
                first_active.save(update_fields=["is_default", "updated_at"])
