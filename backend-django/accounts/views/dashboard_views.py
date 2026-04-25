from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.serializers import OrderSummarySerializer
from ..selectors.order_selectors import get_user_dashboard_summary, get_user_recent_orders


class UserDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        summary_data = get_user_dashboard_summary(user)
        recent_orders = get_user_recent_orders(user, limit=5)

        serializer = OrderSummarySerializer(recent_orders, many=True)

        return Response({"summary": summary_data, "recent_activity": serializer.data})
