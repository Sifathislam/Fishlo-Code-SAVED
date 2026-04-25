from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Product
from ..selectors.content_selectors import get_sources_queryset, get_what_you_get_queryset
from ..serializers import SourceSerializer, WhatYouGetSerializer


# -----------------------
# What You Get API
# -----------------------
class WhatYouGetAPIView(APIView):
    """
    Get WhatYouGet records for a specific product
    """

    def get(self, request, product_id=None):
        try:
            if not Product.objects.filter(id=product_id).exists():
                return Response(
                    {"message": "Product not found"}, status=status.HTTP_404_NOT_FOUND
                )

            what_you_get_items = get_what_you_get_queryset(product_id)

            if not what_you_get_items.exists():
                return Response(
                    {"message": "No data found for this product"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            serializer = WhatYouGetSerializer(
                what_you_get_items, many=True, context={"request": request}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# -----------------------
# Source API
# -----------------------
class SourceAPIView(APIView):
    """
    Get Source records for a specific product
    """

    def get(self, request, product_id=None):
        try:
            if not Product.objects.filter(id=product_id).exists():
                return Response(
                    {"message": "Product not found"}, status=status.HTTP_404_NOT_FOUND
                )

            sources = get_sources_queryset(product_id)

            if not sources.exists():
                return Response(
                    {"message": "No data found for this product"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            serializer = SourceSerializer(sources, many=True, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
