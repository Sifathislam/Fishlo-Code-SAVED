#delivery man service 
# delivery/services/delivery_man_services.py

from rest_framework import status
from delivery.models import DeliveryPartnerProfile
from products.utils import get_user_storage_location  # adjust import path
from django.db.models import Q


def get_delivery_man_list(request):
    try:
        # Get the storage location for the logged-in user
        storage_location = get_user_storage_location(request)

        if not storage_location:
            return False, "No delivery zone found for your location.", [], status.HTTP_404_NOT_FOUND

        # Get filter parameters from request
        search_query = request.query_params.get("search", "")
        duty_status = request.query_params.get("duty_status", "")
        vehicle_type = request.query_params.get("vehicle_type", "")

        # Get all active delivery partners whose zone maps to this storage location
        queryset = DeliveryPartnerProfile.objects.filter(
            zone__storage_location=storage_location,
            status="Active",
        )

        # Apply searching
        if search_query:
            
            queryset = queryset.filter(
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query) |
                Q(user__phone_number__icontains=search_query)
            )

        # Apply filtering
        if duty_status == "ACTIVE":
            queryset = queryset.filter(is_active_duty=True)
        
        if vehicle_type and vehicle_type != "ALL":
            queryset = queryset.filter(vehicle_type=vehicle_type)

        delivery_partners = queryset.select_related("user", "zone")
        
        payload = [
            {
                "id": partner.id,
                "full_name": f"{partner.first_name} {partner.last_name}",
                "status": partner.status,
                "is_active_duty": partner.is_active_duty,
                "zone": partner.zone.name if partner.zone else None,
                "phone": str(partner.user.phone_number) if hasattr(partner.user, "phone_number") else None,
                "vehicle_type": partner.vehicle_type,
            }
            for partner in delivery_partners
        ]

        return True, "Delivery partners fetched successfully.", payload, status.HTTP_200_OK

    except Exception as e:
        return False, str(e), [], status.HTTP_500_INTERNAL_SERVER_ERROR