# inventory/services/delivery_charge_service.py

from decimal import Decimal
from ..models.delivery_charge_models import DeliveryChargeModel
from accounts.models.address_models import UserAddress
import requests
from django.conf import settings
from django.utils import timezone
from typing import Optional, Union

def get_delivery_charge_for_distance(*,storagelocation,distance_km: Decimal,return_model: bool = False,) -> Union[DeliveryChargeModel, dict]:
    """
    Returns dict like:
    {
      "charge_type": "PAID",
      "charge_amount": "100.00",
    }
    """
    if storagelocation is None or distance_km is None:
        return {
            "charge_type": None,
            "charge_amount": None,
        }

    qs = (DeliveryChargeModel.objects.filter(storagelocation=storagelocation, is_active=True).order_by("min_distance_km"))

    # [min, max)
    rule = qs.filter(min_distance_km__lte=distance_km, max_distance_km__gt=distance_km).first()
    if return_model:
            return rule  # can be None
    if not rule:
        return {
            "charge_type": None,
            "charge_amount": None,
        }

    return {
        "charge_type": rule.charge_type,
        "charge_amount": str(rule.charge_amount),
    }
    
def get_delivery_distance(address_id, storage_location):
    user_location = UserAddress.objects.filter(id=address_id).first()

    if not user_location or not storage_location:
        return None

    origins = f"{storage_location.point_lat},{storage_location.point_long}"
    destinations = f"{user_location.latitude},{user_location.longitude}"

    params = {
        "origins": origins,
        "destinations": destinations,
        "mode": "driving",
        "departure_time": "now",
        "units": "metric",
        "key": settings.GOOGLE_MAPS_API_KEY,
    }

    response = requests.get(
        "https://maps.googleapis.com/maps/api/distancematrix/json",
        params=params,
        timeout=5
    )

    data = response.json()

    if data.get("status") != "OK":
        return None

    element = data["rows"][0]["elements"][0]

    if element.get("status") != "OK":
        return None

    # Distance in meters
    distance_meters = element["distance"]["value"]

    # Convert to KM
    distance_km = Decimal(distance_meters) / Decimal("1000")

    return round(distance_km, 2)