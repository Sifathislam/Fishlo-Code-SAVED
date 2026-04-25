from rest_framework.views import APIView
from rest_framework.response import Response

from orders.services.bi_services import (
    get_bi_summary_service,
    get_bi_charts_service,
    get_bi_customers_service,
    get_bi_riders_service,
)


from rest_framework.permissions import IsAuthenticated
from store_management.permissions import IsStoreManagerStaff

class BISummaryView(APIView):
    """GET /api/analytics/bi/summary/"""
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]

    def get(self, request):
        data = get_bi_summary_service(
            request,
            period=request.query_params.get("period", "14"),
            start_str=request.query_params.get("start"),
            end_str=request.query_params.get("end"),
        )
        return Response(data)


class BIChartsView(APIView):
    """GET /api/analytics/bi/charts/"""
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]

    def get(self, request):
        data = get_bi_charts_service(
            request,
            period=request.query_params.get("period", "14"),
            start_str=request.query_params.get("start"),
            end_str=request.query_params.get("end"),
        )
        return Response(data)


class BICustomersView(APIView):
    """GET /api/analytics/bi/customers/"""
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]

    def get(self, request):
        data = get_bi_customers_service(
            request,
            period=request.query_params.get("period", "14"),
            start_str=request.query_params.get("start"),
            end_str=request.query_params.get("end"),
        )
        return Response(data)


class BIRidersView(APIView):
    """GET /api/analytics/bi/riders/"""
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]

    def get(self, request):
        data = get_bi_riders_service(
            request,
            period=request.query_params.get("period", "14"),
            start_str=request.query_params.get("start"),
            end_str=request.query_params.get("end"),
        )
        return Response(data)