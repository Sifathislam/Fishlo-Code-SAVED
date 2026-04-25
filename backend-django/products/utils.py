from decimal import Decimal

from django.contrib.gis.geos import Point

from accounts.models import UserAddress
from delivery.models import DeliveryZone
from inventory.models import StorageLocation


def get_user_storage_location(request, address_id=None):
    # ============================================
    # STEP 1: Get User's Address
    # ============================================
    user_address = None
    address_pointer = None

    if request.user.is_authenticated:
        if address_id:
            user_address = (
                UserAddress.objects.filter(
                    user=request.user, id=address_id, is_active=True
                )
                .only("latitude", "longitude")
                .first()
            )
        else:
            user_address = (
                UserAddress.objects.filter(
                    user=request.user, is_default=True, is_active=True
                )
                .only("latitude", "longitude")
                .first()
            )
        if user_address:
            address_pointer = user_address.point
        else:
            point_long=72.99778409999999
            point_lat=19.0744857
            address_pointer = Point((point_long,point_lat), srid=4326)
            
    else:
        # Guest user
        session_id = request.headers.get("X-Session-ID")
        if session_id:
            user_address = (
                UserAddress.objects.filter(
                    session_key=session_id,
                    user__isnull=True,
                    is_active=True,
                    is_default=True,
                )
                .only("latitude", "longitude")
                .first()
            )
            if user_address is None:
                user_address = (
                UserAddress.objects.filter(
                    session_key=session_id,
                    user__isnull=True,
                    is_active=True,
                )
                .only("latitude", "longitude")
                .first())
                 
            if user_address:
                address_pointer = user_address.point
            
        else:
            point_long=72.99778409999999
            point_lat=19.0744857
            address_pointer = Point((point_long,point_lat), srid=4326)
        
            
    # ============================================
    # STEP 2: Validate Coordinates
    # ============================================
    if not address_pointer:
            return None
    # ============================================
    # STEP 3: Point-in-Polygon Check
    # ============================================

    # Direct zone lookup with storage prefetch
    delivery_zone = (
        DeliveryZone.objects.filter(geom__contains=address_pointer, is_active=True)
        .select_related("storage_location")
        .first()
    )
    if delivery_zone:
        return delivery_zone.storage_location

    # User is outside all zones
    return None

def get_default_storage():

    try:
        return StorageLocation.objects.get(id=1)
    except StorageLocation.DoesNotExist:
        return StorageLocation.objects.first()

def get_location_price_matrix(product, context):
    storage_location = context.get("storage_location")

    # 1. If we have a specific location, look for an active price there
    if storage_location:
        return product.prices.filter(
            is_active=True,
            storage_location=storage_location
        ).first()

    #  Fallback to the product's general active price matrix
    return product.get_price_matrix()
# --------------------------
# Helper method to get inventory
# --------------------------
def get_location_inventory(product, context):

    storage_location = context.get("storage_location")

    # If storage location is provided
    if storage_location:
        try:
            return product.inventory.get(storagelocation=storage_location)
        except product.inventory.model.DoesNotExist:
            return None  # No inventory found for this location

    # If no location given but product has default inventory
    try:
        return product.get_inventory()
    except Exception:
        return None


def is_in_delivery_zone_func(product, context):
    try:
        inventory = get_location_inventory(product, context)
        return context.get("storage_location") is not None and inventory is not None
    except Exception:
        return False
def get_product_max_stock(inventory,product):
        if product.sell_type =="WEIGHT":
            return inventory.stock_kg if inventory else 0
        else:
            return inventory.stock_pieces if inventory else 0
    

def users_current_location(request):
    user_address = None

    if request.user.is_authenticated:
        user_address = (
                UserAddress.objects.filter(
                    user=request.user, is_default=True, is_active=True
                )
                .only("latitude", "longitude","house_details")
                .first()
            )
        if user_address is None:
              user_address = (
                UserAddress.objects.filter(
                    user=request.user, is_active=True
                )
                .only("latitude", "longitude","house_details")
                .first()
            ) 
    else:
        # Guest user
        session_id = request.headers.get("X-Session-ID")
        if session_id:
            user_address = (
                UserAddress.objects.filter(
                    session_key=session_id,
                    user__isnull=True,
                    is_active=True,
                    is_default=True,
                )
                .only("latitude", "longitude","house_details")
                .first()
            )
            if user_address is None:
                user_address = (
                UserAddress.objects.filter(
                    session_key=session_id,
                    user__isnull=True,
                    is_active=True,
                )
                .only("latitude", "longitude","house_details")
                .first()
            )
    return user_address