from rest_framework import serializers
from products.models import Product

class ProductSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name"]
