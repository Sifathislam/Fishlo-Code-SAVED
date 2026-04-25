from django.db import transaction
from rest_framework import generics, status
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from inventory.models import Inventory

from ..permissions import IsStoreManagerStaff
from ..serializers.inventory_serializers import (
    InventoryListSerializer,
    InventoryCreateUpdateSerializer,
    InventoryHistoryListSerializer,
)

from ..services.inventory_services import (
    inventory_list_queryset_service,
    inventory_create_service,
    inventory_update_service,
    inventory_history_queryset_service,
)


class InventoryListCreateAPIView(generics.ListCreateAPIView):
    """
    GET  -> Inventory table (search + tab filter)
    POST -> Add Inventory (no storagelocation id from frontend)
    """
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]
    filter_backends = [SearchFilter]
    search_fields = ["product__name", "sku"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return InventoryCreateUpdateSerializer
        return InventoryListSerializer

    def get_queryset(self):
        # must return QuerySet (not Response)
        return inventory_list_queryset_service(self.request)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        inv = inventory_create_service(request, serializer)
        return Response(InventoryListSerializer(inv).data, status=status.HTTP_201_CREATED)


class InventoryRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    """
    PUT/PATCH -> Edit Inventory (must create history automatically)
    """
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]
    serializer_class = InventoryCreateUpdateSerializer
    queryset = Inventory.objects.select_related("product", "storagelocation")

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        partial = kwargs.pop("partial", False)

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        instance = inventory_update_service(request, instance, serializer, partial=partial)

        return Response(InventoryListSerializer(instance).data, status=200)


class InventoryHistoryListAPIView(generics.ListAPIView):
    """
    GET -> All History table:
      - search
      - action_type filter
      - date range (start, end)
    """
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]
    serializer_class = InventoryHistoryListSerializer
    filter_backends = [SearchFilter]
    search_fields = ["product__name", "inventory__sku", "notes", "updated_by__email"]

    def get_queryset(self):
        return inventory_history_queryset_service(self.request)
