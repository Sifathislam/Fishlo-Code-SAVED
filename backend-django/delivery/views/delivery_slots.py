from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication

from delivery.services.delivery_slot_service import get_delivery_slots_payload


class DeliverySlotsAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def get(self, request):
        success, message, payload, status_code = get_delivery_slots_payload(request)
        return Response(
            {"success": success, "message": message, "data": payload},
            status=status_code,
        )
