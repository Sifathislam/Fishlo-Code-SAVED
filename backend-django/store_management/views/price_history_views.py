from rest_framework import generics
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from ..permissions import IsStoreManagerStaff
from ..serializers.price_history_serializers import PriceHistorySerializer
from ..selectors.price_history_selectors import price_history_qs, price_history_filtered_qs
from ..services.price_history_export_service import export_price_history_csv
from ..utils import get_manager_storage_location


class PriceHistoryListAPIView(generics.ListAPIView):
    """
    GET -> Price History (Recent Changes)
    Supports: product query param (and DRF SearchFilter)
    """
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]
    serializer_class = PriceHistorySerializer
    filter_backends = [SearchFilter]
    search_fields = ["product__name", "product__slug"]

    def get_queryset(self):
        storage_location = get_manager_storage_location(self.request)
        qs = price_history_qs(storage_location)

        product_id = self.request.query_params.get("product")
        if product_id:
            qs = qs.filter(product_id=product_id)

        return qs


class PriceHistoryExportAPIView(APIView):
    """
    GET -> Export price history (CSV)
    Query params:
      - search: product name/slug
      - action: CREATED / UPDATED / DEACTIVATED (optional)
    """
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]

    def get(self, request):
        storage_location = get_manager_storage_location(request)

        search = request.query_params.get("search")
        action = request.query_params.get("action")

        qs = price_history_filtered_qs(
            storage_location,
            search=search,
            action=action,
        )

        return export_price_history_csv(qs)
