from ..models import UserAddress


def get_active_addresses_for_user(user):
    return UserAddress.objects.filter(user=user, is_active=True)


def get_active_addresses_for_session(session_id):
    return UserAddress.objects.filter(
        session_key=session_id, user__isnull=True, is_active=True
    )


def get_address_for_user(address_id, user):
    return UserAddress.objects.get(id=address_id, user=user, is_active=True)


def get_address_for_session(address_id, session_id):
    return UserAddress.objects.get(
        id=address_id,
        session_key=session_id,
        user__isnull=True,
        is_active=True,
    )
