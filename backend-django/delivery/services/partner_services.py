from rest_framework import status
from delivery.models import DeliveryPartnerProfile

def update_active_duty_status(request, is_active):
    """
    Updates the is_active_duty status for the logged-in delivery partner.
    """
    try:
        partner = request.user.delivery_partner_profile
    except Exception:
        return False, "Delivery partner profile not found.", None, status.HTTP_404_NOT_FOUND

    partner.is_active_duty = is_active
    partner.save(update_fields=["is_active_duty"])

    return True, f"Status updated to {'Active' if is_active else 'Inactive'}.", {"is_active_duty": partner.is_active_duty}, status.HTTP_200_OK
