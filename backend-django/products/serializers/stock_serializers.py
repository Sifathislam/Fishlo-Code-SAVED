from rest_framework import serializers

from ..models import StockNotifyRequest
from ..utils import get_location_inventory


# ---------------------------
# StockNotifyRequestSerializer
# ---------------------------
class StockNotifyRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockNotifyRequest
        fields = ["id", "product", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_product(self, value):
        inventory = get_location_inventory(value, self.context)

        if inventory and inventory.is_out_of_stock() == False:
            raise serializers.ValidationError("This product is currently in stock.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        product = attrs.get("product")

        if StockNotifyRequest.objects.filter(user=user, product=product).exists():
            raise serializers.ValidationError(
                "You already requested notification for this product."
            )
        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
