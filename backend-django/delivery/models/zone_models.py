from django.contrib.gis.db import models as gis_models

from inventory.models import StorageLocation


class DeliveryZone(gis_models.Model):
    name = gis_models.CharField(max_length=100)

    # which storage serves this zone
    storage_location = gis_models.ForeignKey(
        StorageLocation, on_delete=gis_models.CASCADE, related_name="delivery_zones"
    )

    # polygon or multipolygon defining the area
    geom = gis_models.MultiPolygonField(srid=4326)

    is_active = gis_models.BooleanField(default=True)

    created_at = gis_models.DateTimeField(auto_now_add=True)
    updated_at = gis_models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Delivery Zone"
        verbose_name_plural = "Delivery Zones"

    def __str__(self):
        return f"{self.name} ({self.storage_location.name})"
