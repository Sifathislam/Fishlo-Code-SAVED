from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication

from store_management.permissions import IsStoreManagerStaff
from delivery.services.store_delivery_services import (
    get_store_delivery_partners,
    create_store_delivery_partner,
    update_store_delivery_partner,
    deactivate_store_delivery_partner
)

class StoreDeliveryPartnerListCreateView(APIView):
    """
    Store Dashboard: List and create delivery partners.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStoreManagerStaff]

    def get(self, request):
        success, message, data, status_code = get_store_delivery_partners(request)
        return Response({
            "success": success,
            "message": message,
            "data": data if success else getattr(data, "errors", data)
        }, status=status_code)

    def post(self, request):
        success, message, data, status_code = create_store_delivery_partner(request, request.data)
        return Response({
            "success": success,
            "message": message,
            "data": data if success else getattr(data, "errors", data)
        }, status=status_code)


class StoreDeliveryPartnerDetailView(APIView):
    """
    Store Dashboard: Update or deactivate a specific delivery partner.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsStoreManagerStaff]

    def patch(self, request, pk):
        success, message, data, status_code = update_store_delivery_partner(request, pk, request.data)
        return Response({
            "success": success,
            "message": message,
            "data": data if success else getattr(data, "errors", data)
        }, status=status_code)

    def delete(self, request, pk):
        success, message, data, status_code = deactivate_store_delivery_partner(request, pk)
        return Response({
            "success": success,
            "message": message,
            "data": data
        }, status=status_code)
