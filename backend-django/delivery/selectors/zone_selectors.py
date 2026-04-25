from ..models import DeliveryZone


def get_active_delivery_zones():
    return DeliveryZone.objects.filter(is_active=True)
