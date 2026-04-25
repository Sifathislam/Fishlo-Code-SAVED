from django.db import transaction

from rest_framework import generics, status
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from products.models.product_models import PriceMatrix
from ..permissions import IsStoreManagerStaff
from ..serializers.price_history_serializers import (
    PriceMatrixListSerializer,
    PriceMatrixCreateUpdateSerializer,
)
from ..selectors.price_matrix_selectors import active_price_matrix_qs
from ..services.price_matrix_service import (
    create_price_matrix_with_history,
    update_price_matrix_with_history,
)
from ..utils import get_manager_storage_location


class PriceMatrixListCreateAPIView(generics.ListCreateAPIView):
    """
    GET  -> Pricing Overview (active)
    POST -> Create pricing (deactivate previous active for same product+location)
    """
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]
    filter_backends = [SearchFilter]
    search_fields = ["product__name", "product__slug"]

    def get_queryset(self):
        storage_location = get_manager_storage_location(self.request)
        products = active_price_matrix_qs(storage_location)
        return products

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PriceMatrixCreateUpdateSerializer
        return PriceMatrixListSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        
        storage_location = get_manager_storage_location(request)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_obj = create_price_matrix_with_history(
            user=request.user,
            storage_location=storage_location,
            validated_data=serializer.validated_data,
        )

        return Response(
            PriceMatrixListSerializer(new_obj).data,
            status=status.HTTP_201_CREATED
        )


class PriceMatrixUpdateAPIView(generics.UpdateAPIView):
    """
    PUT/PATCH -> Edit pricing (logs old/new)
    """
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]
    serializer_class = PriceMatrixCreateUpdateSerializer

    def get_queryset(self):
        storage_location = get_manager_storage_location(self.request)
        return (
            PriceMatrix.objects
            .select_related("product", "storage_location")
            .filter(storage_location=storage_location, is_active=True)
        )
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        storage_location = get_manager_storage_location(request)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        obj = update_price_matrix_with_history(
            user=request.user,
            storage_location=storage_location,
            instance=instance,
            serializer=serializer,
        )

        return Response(PriceMatrixListSerializer(obj).data, status=status.HTTP_200_OK)
