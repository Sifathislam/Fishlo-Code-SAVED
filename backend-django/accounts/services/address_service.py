import json
from django.db import transaction

from ..utils import addressCreatorFunction


def ensure_guest_session_address(view_instance, request):
    """
    Keeps your existing logic:
    if no session id -> create default address and return session_id
    """
    session_id = view_instance.get_session_id(request)
    if session_id:
        return session_id
    else:
         return None

def create_address_service(view_instance, request):
    data = json.loads(request.body)
    return addressCreatorFunction(view_instance, request, data)  # returns (payload, status)

@transaction.atomic
def merge_addresses_service(view_instance, request, session_id):
    from ..models import UserAddress

    guest_addresses = UserAddress.objects.filter(
        session_key=session_id, user__isnull=True, is_active=True
    )

    if not guest_addresses.exists():
        return {"message": "No addresses to merge"}, 200

    merged_count = 0
    updated_count = 0

    for guest_addr in guest_addresses:
        duplicate = view_instance.is_duplicate_address(
            user=request.user,
            address_data={
                "house_details": guest_addr.house_details,
                "city": guest_addr.city,
                "state": guest_addr.state,
                "postal_code": guest_addr.postal_code,
            },
        )

        if duplicate:
            # if duplicate exists, only update coords if needed
            if guest_addr.latitude is not None and guest_addr.longitude is not None:
                if (
                    duplicate.latitude != guest_addr.latitude
                    or duplicate.longitude != guest_addr.longitude
                ):
                    duplicate.latitude = guest_addr.latitude
                    duplicate.longitude = guest_addr.longitude
                    duplicate.save(update_fields=["latitude", "longitude", "updated_at"])
                    updated_count += 1

            # optional: remove guest duplicate so session is cleaned
            guest_addr.soft_delete()
            continue

        # not duplicate → create new user address
        UserAddress.objects.create(
            user=request.user,
            address_type=guest_addr.address_type,
            address_type_other=guest_addr.address_type_other,
            recipient_name=guest_addr.recipient_name,
            recipient_phone=guest_addr.recipient_phone,
            house_details=guest_addr.house_details,
            address_line_2=guest_addr.address_line_2,
            landmark=guest_addr.landmark,
            city=guest_addr.city,
            state=guest_addr.state,
            country=guest_addr.country,
            postal_code=guest_addr.postal_code,
            latitude=guest_addr.latitude,
            longitude=guest_addr.longitude,
            is_default=False,
            is_active=True,
        )

        merged_count += 1

    return {
        "message": f"Merged {merged_count} addresses, updated {updated_count}",
        "data": {"merged": merged_count, "updated": updated_count},
    }, 200


def set_default_address_service(request, address):
    from ..models import UserAddress
    if request.user.is_authenticated:
        UserAddress.objects.filter(user=request.user, is_default=True).exclude(
            id=address.id
        ).update(is_default=False)
    else:
        UserAddress.objects.filter(session_key=address.session_key, is_default=True).exclude(
            id=address.id
        ).update(is_default=False)
    address.is_default = True
    address.save()

