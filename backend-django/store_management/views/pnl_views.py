from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from orders.services.analytics_services import parse_date_range
from store_management.permissions import IsStoreManagerStaff
from ..selectors.pnl_selectors import get_pnl_summary, get_pnl_chart_data

class PnLSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]

    def get(self, request):
        start, end = parse_date_range(
            period=request.query_params.get("period", "14"),
            start_str=request.query_params.get("start"),
            end_str=request.query_params.get("end"),
        )
        data = get_pnl_summary(request, start, end)
        return Response(data)

class PnLChartsView(APIView):
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]

    def get(self, request):
        start, end = parse_date_range(
            period=request.query_params.get("period", "14"),
            start_str=request.query_params.get("start"),
            end_str=request.query_params.get("end"),
        )
        trend_data = get_pnl_chart_data(request, start, end)
        return Response({
            "monthly_trend": trend_data
        })
