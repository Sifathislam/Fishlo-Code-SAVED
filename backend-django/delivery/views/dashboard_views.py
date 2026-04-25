# delivery/views/dashboard_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import status

from delivery.selectors.dashboard_selectors import get_dashboard_stats


class DeliveryDashboardView(APIView):
    """
    Get dashboard statistics for the logged-in delivery partner.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            partner = request.user.delivery_partner_profile
        except Exception:
            return Response(
                {"success": False, "message": "Delivery partner profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        stats = get_dashboard_stats(partner)
        
        return Response({
            "success": True,
            "message": "Dashboard stats fetched successfully.",
            "data": stats
        }, status=status.HTTP_200_OK)
