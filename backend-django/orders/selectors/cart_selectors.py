from products.utils import (
    get_location_inventory,
    get_user_storage_location,
    is_in_delivery_zone_func,
)
from products.models import WeightOption

def get_inventory(request,product):
    user_storage_location = get_user_storage_location(request)
    context = {"storage_location": user_storage_location}
    inventory = get_location_inventory(product, context)
    
    return inventory

def get_weight_obj(weight_id,product):
    weight_obj = WeightOption.objects.get(id=weight_id, product=product,is_active=True)
    return weight_obj 