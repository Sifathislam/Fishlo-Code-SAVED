from rest_framework.response import Response
from rest_framework.views import APIView

from ..selectors.zone_selectors import get_active_delivery_zones
from ..serializers import DeliveryZoneGeoJSONSerializer


class DeliveryZoneListView(APIView):
    def get(self, request):
        # Get only active zones
        zones = get_active_delivery_zones()
        serializer = DeliveryZoneGeoJSONSerializer(zones, many=True)

        # Wrap the list in a FeatureCollection
        geojson_data = {
            "type": "FeatureCollection",
            "features": serializer.data
        }

        return Response(geojson_data)
