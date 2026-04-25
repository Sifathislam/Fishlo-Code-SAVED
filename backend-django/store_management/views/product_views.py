from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from products.models import Product
from ..serializers.product_serializers import ProductSimpleSerializer
from ..permissions import IsStoreManagerStaff

class ProductSimpleListView(generics.ListAPIView):
    queryset = Product.objects.all().order_by('name')
    serializer_class = ProductSimpleSerializer
    pagination_class = None
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]

