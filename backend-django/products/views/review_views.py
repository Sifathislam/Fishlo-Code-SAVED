from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Product, Review
from ..selectors.review_selectors import get_approved_reviews_for_product
from ..serializers import CreateReviewSerializer, ProductReviewSerializer


# --------------------------
# ReviewPaginationView
# --------------------------
class ReviewPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


# --------------------------
# ProductReviewListView
# --------------------------
class ProductReviewListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, slug):
        product = get_object_or_404(Product, slug=slug, deleted_at__isnull=True)

        reviews = get_approved_reviews_for_product(product)

        paginator = ReviewPagination()
        paginated_reviews = paginator.paginate_queryset(reviews, request)

        serializer = ProductReviewSerializer(paginated_reviews, many=True)

        return paginator.get_paginated_response(
            {
                "product_id": product.id,
                "product_name": product.name,
                "reviews": serializer.data,
            }
        )


# --------------------------
# CreateReviewView
# --------------------------
class CreateReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        product = get_object_or_404(Product, slug=slug, deleted_at__isnull=True)

        if Review.objects.filter(user=request.user, product=product).exists():
            return Response(
                {"error": "You have already reviewed this product."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CreateReviewSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user=request.user, product=product, is_approved=False)
            return Response(
                {
                    "message": "Review submitted successfully.",
                    "review": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
