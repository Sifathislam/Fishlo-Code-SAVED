import json

from django.contrib.gis.geos import GEOSGeometry, MultiPolygon
from django.db import models, transaction

from inventory.models import StorageLocation

from .zone_models import DeliveryZone


class DeliveryZoneUpload(models.Model):
    """
    Helper model: upload a GeoJSON file and create/update DeliveryZone.
    One upload -> one zone.
    """

    name = models.CharField(
        max_length=100,
        help_text="Name for the delivery zone (e.g. 'Zone 1 - Koparkhairane')",
    )
    storage_location = models.ForeignKey(
        StorageLocation, on_delete=models.CASCADE, help_text="Hub that serves this zone"
    )
    geojson_file = models.FileField(
        upload_to="delivery_zones/",
        help_text="GeoJSON file containing a Polygon or MultiPolygon",
    )

    processed = models.BooleanField(
        default=False, help_text="Has this file been processed into DeliveryZone?"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Upload: {self.name}"

    def process_geojson(self):
        """
        Parse the GeoJSON file and create/update the DeliveryZone.
        """
        # 1. Load file content
        self.geojson_file.seek(0)
        data = json.load(self.geojson_file)

        features = data.get("features", [])
        if not features:
            raise ValueError("GeoJSON has no features")

        # For now we assume ONE polygon per file
        feature = features[0]
        geom_data = feature.get("geometry")
        if not geom_data:
            raise ValueError("Feature has no geometry")

        geom = GEOSGeometry(json.dumps(geom_data))

        # Ensure MultiPolygon
        if geom.geom_type == "Polygon":
            geom = MultiPolygon(geom)
        elif geom.geom_type != "MultiPolygon":
            raise ValueError(f"Unsupported geometry type: {geom.geom_type}")

        with transaction.atomic():
            # 2. Deactivate all previous zones with same name + storage_location
            z = DeliveryZone.objects.filter(
                storage_location=self.storage_location, is_active=True
            )
            z.update(is_active=False)

            # 3. Create a NEW DeliveryZone row (new version)
            zone = DeliveryZone.objects.create(
                name=self.name,
                storage_location=self.storage_location,
                geom=geom,
                is_active=True,
            )

            # 4. Link this upload to the new zone
            self.processed = True

            super(self.__class__, self).save(update_fields=["processed"])

    def save(self, *args, **kwargs):
        # First save the upload record so file is stored on disk
        is_new = self.pk is None
        super().save(*args, **kwargs)

        # Only auto-process new uploads OR unprocessed ones
        if not self.processed:
            # Wrap in try/except so admin doesn't totally explode
            try:
                self.process_geojson()
            except Exception as e:
                # You can log this, or re-raise to see the error
                raise
