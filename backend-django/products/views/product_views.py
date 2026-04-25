import json

from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django.views import View
from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from inventory.models import Inventory

from ..mixins import RecentlyViewedMixin
from ..models import Product
from ..serializers import ProductDetailSerializer, ProductListSerializer, ProductSearchSerializer
from ..selectors.product_selectors import (
    get_products_list_queryset,
    get_most_loved_products_queryset,
    get_recently_viewed_products_queryset,
    get_product_search_queryset,
    get_related_products_queryset,
)
from ..utils import get_user_storage_location,users_current_location

from ..services.delivery_time_service import get_delivery_time_response
# ------------------
# ProductPagination
# ------------------
class ProductPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# -----------------
# ProductListView
# -----------------
class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    pagination_class = ProductPagination
    ordering = ["-created_at"]
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def get_queryset(self):
        return get_products_list_queryset(self.request,False)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["storage_location"] = get_user_storage_location(self.request)
        return context

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        if not queryset.exists():
            category_slug = request.query_params.get("category", None)
            subcategory_slug = request.query_params.get("subcategory", None)

            if subcategory_slug:
                message = f"No products found in the subcategory '{subcategory_slug}'"
            elif category_slug:
                message = f"No products found in the category '{category_slug}'"
            else:
                message = "No products available"

            return Response(
                {
                    "count": 0,
                    "next": None,
                    "previous": None,
                    "results": [],
                    "message": message,
                }
            )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class MostLovedProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    pagination_class = ProductPagination
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def get_queryset(self):
        return get_most_loved_products_queryset(self.request)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["storage_location"] = get_user_storage_location(self.request)
        return context

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        if not queryset.exists():
            return Response(
                {
                    "count": 0,
                    "next": None,
                    "previous": None,
                    "results": [],
                    "message": "No most loved products found yet.",
                }
            )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# -------------------------------
# Recently Viewed List View
# -------------------------------
class RecentlyViewedListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    pagination_class = ProductPagination
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return get_recently_viewed_products_queryset(self.request)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["storage_location"] = get_user_storage_location(self.request)
        return context

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        if not queryset:
            return Response(
                {
                    "count": 0,
                    "next": None,
                    "previous": None,
                    "results": [],
                    "message": "No recently viewed products",
                }
            )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# --------------------------
# ProductDetailView
# --------------------------
class ProductDetailView(RecentlyViewedMixin, APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, slug):
        storage_location = get_user_storage_location(request)

        inventory_prefetch = Prefetch(
            "inventory",
            queryset=(
                Inventory.objects.filter(storagelocation=storage_location)
                if storage_location
                else Inventory.objects.all()
            ),
            to_attr="location_inventory",
        )
        product = get_object_or_404(
            Product.objects.select_related("category", "subcategory").prefetch_related(
                "cuts", "gallery", "reviews", inventory_prefetch
            ),
            slug=slug,
            deleted_at__isnull=True,
        )

        if request.user.is_authenticated:
            self.add_recently_viewed(request, product.id)

        serializer = ProductDetailSerializer(
            product,
            context={
                "request": request,
                "storage_location": get_user_storage_location(self.request),
            },
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


# --------------------------
# ProductSearchAPIView
# --------------------------
class ProductSearchAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        queryset = get_product_search_queryset(request)

        serializer = ProductSearchSerializer(
            queryset,
            many=True,
            context={
                "request": request,
                "storage_location": get_user_storage_location(self.request),
            },
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


# --------------------------
# RelatedProductsView
# --------------------------
class RelatedProductsPagination(PageNumberPagination):
    page_size = 18
    page_size_query_param = "limit"
    max_page_size = 20


class RelatedProductsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, slug):
        limit = request.query_params.get("limit", 8)
        try:
            limit = max(1, min(20, int(limit)))
        except (ValueError, TypeError):
            limit = 8

        try:
            related_products = get_related_products_queryset(request, slug)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND
            )

        paginator = RelatedProductsPagination()
        paginated_queryset = paginator.paginate_queryset(
            related_products, request, view=self
        )

        if paginated_queryset is not None:
            serializer = ProductListSerializer(
                paginated_queryset,
                many=True,
                context={
                    "request": request,
                    "storage_location": get_user_storage_location(self.request),
                },
            )
            return paginator.get_paginated_response(serializer.data)

        serializer = ProductListSerializer(
            related_products,
            many=True,
            context={
                "request": request,
                "storage_location": get_user_storage_location(self.request),
            },
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
class GetDeliveryTime(APIView):
    def get(self, request):
        user_location = users_current_location(request)
        storage_location = get_user_storage_location(request)

        data = get_delivery_time_response(user_location, storage_location)

        return Response(data)