# discounts/views/discount_views.py

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from ..services.discount_services import (
    available_discounts_service,
    validate_discount_service,
)


class ValidateDiscountView(APIView):
    """Validate discount code and calculate discount amount"""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        success, message, data, status_code = validate_discount_service(request)

        if not success:
            return Response(
                {"success": False, "message": message},
                status=(
                    status.HTTP_404_NOT_FOUND
                    if status_code == 404
                    else status.HTTP_400_BAD_REQUEST
                ),
            )

        return Response(
            {"success": True, "message": message, "data": data},
            status=status.HTTP_200_OK,
        )


class AvailableDiscountsView(APIView):
    """
    Get all available discounts sorted by maximum discount amount.
    Optimized with advanced Django queries for fast performance.
    """

    def get(self, request):
        payload = available_discounts_service(request)
        return Response(payload)
