from rest_framework.exceptions import PermissionDenied
from .models.manager_models import StoreManagerProfile


def get_manager_storage_location(request):
    """
    Returns storage location of logged-in store manager.
    Raises PermissionDenied if not valid.
    """
    user = request.user

    profile = StoreManagerProfile.objects.filter(user=user).select_related("storage_location").first()

    if not profile:
        raise PermissionDenied("This account is not a Store Manager.")

    # if not user.is_staff:
    #     raise PermissionDenied("This account doesn't have staff permission.")

    if not profile.storage_location:
        raise PermissionDenied("No storage location assigned to this manager.")

    return profile.storage_location

def get_safe_storage_location(request):
    """
    Tries to get the manager's assigned storage location.
    Falls back to the user's delivery-based storage location ONLY
    if the user is not a store manager at all.
    """
    from products.utils import get_user_storage_location
    import logging
    logger = logging.getLogger(__name__)

    user = request.user

    # If not authenticated, fall back to coordinate-based lookup
    if not user or not user.is_authenticated:
        return get_user_storage_location(request)

    # Check if the user has a StoreManagerProfile
    profile = StoreManagerProfile.objects.filter(
        user=user
    ).select_related("storage_location").first()

    if profile:
        # User IS a store manager — return their assigned location (or None)
        if profile.storage_location:
            return profile.storage_location
        else:
            logger.warning(f"Store manager {user} has no storage_location assigned.")
            return None

    # User is NOT a store manager — use coordinate-based fallback
    return get_user_storage_location(request)
