from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

from orders.services.analytics_services import (
    parse_date_range,
    get_analytics_summary,
    get_analytics_charts,
    get_analytics_tables,
    get_analytics_customer_insights,
)

from rest_framework.permissions import IsAuthenticated
from store_management.permissions import IsStoreManagerStaff

class AnalyticsSummaryView(APIView):
    """
    GET /analytics/reports/summary/?period=14
    GET /analytics/reports/summary/?start=2025-03-01&end=2025-03-25
    Returns KPI cards: revenue, orders, avg order value with % change.
    """
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]


    def get(self, request):
        start, end = parse_date_range(
            period=request.query_params.get("period", "14"),
            start_str=request.query_params.get("start"),
            end_str=request.query_params.get("end"),
        )
        data = get_analytics_summary(request, start, end)
        return Response(data)



class AnalyticsChartsView(APIView):
    """
    GET /api/analytics/charts/?period=14
    Returns daily sales chart + category breakdown.
    """
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]

    def get(self, request):
        start, end = parse_date_range(
            period=request.query_params.get("period", "14"),
            start_str=request.query_params.get("start"),
            end_str=request.query_params.get("end"),
        )
        data = get_analytics_charts(request,start, end)
        return Response(data)


class AnalyticsTablesView(APIView):
    """
    GET /api/analytics/tables/?period=14&top=5
    Returns top products + top customers tables.
    """
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]

    def get(self, request):
        start, end = parse_date_range(
            period=request.query_params.get("period", "14"),
            start_str=request.query_params.get("start"),
            end_str=request.query_params.get("end"),
        )
        top_n = int(request.query_params.get("top", 5))
        data = get_analytics_tables(request, start, end, top_n=top_n)
        return Response(data)

class AnalyticsCustomerInsightsView(APIView):
    """
    GET /api/analytics/customers/?period=14
    Returns total/new/returning customers, repeat rate, and tables for repeat & new customers.
    """
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]

    def get(self, request):
        start, end = parse_date_range(
            period=request.query_params.get("period", "14"),
            start_str=request.query_params.get("start"),
            end_str=request.query_params.get("end"),
        )
        data = get_analytics_customer_insights(request, start, end)
        return Response(data)