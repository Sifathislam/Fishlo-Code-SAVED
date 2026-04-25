from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from ..services.stock_service import create_stock_notify_request
from ..utils import get_user_storage_location

# ---------------------------
# Stock Notify Request API
# ---------------------------
class StockNotifyRequestCreateView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["storage_location"] = get_user_storage_location(self.request)
        return context

    def post(self, request):
        serializer = create_stock_notify_request(request)

        return Response(
            {
                "message": "You will be notified when this product is back in stock.",
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )
