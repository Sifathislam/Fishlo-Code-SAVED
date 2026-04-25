from rest_framework import serializers
import json

from ..models import DeliveryZone


class DeliveryZoneGeoJSONSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField()
    properties = serializers.SerializerMethodField()
    geometry = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryZone
        fields = ['type', 'properties', 'geometry']

    def get_type(self, obj):
        return "Feature"

    def get_properties(self, obj):
        return {
            "id": obj.id,  # Or a slug if you prefer
            "name": obj.name,
            "storage_location": obj.storage_location.name,
            "color": "#d7574c",  # You could also add a 'color' field to your model
            "is_active": obj.is_active
        }

    def get_geometry(self, obj):
        # geom.json returns a string, so we load it into a dict
        return json.loads(obj.geom.json)
