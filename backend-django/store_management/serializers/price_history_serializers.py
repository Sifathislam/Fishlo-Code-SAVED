from rest_framework import serializers
from ..models.price_history_models import PriceHistory
from ..utils import get_manager_storage_location
from products.models.product_models import PriceMatrix,Product
from inventory.models.inventory_models import Inventory
class PriceMatrixListSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = PriceMatrix
        fields = [
            "id",
            "product",
            "product_image",
            "product_name",
            "wholesale_price",
            "regular_price",
            "display_price",
            "bargain_price",
            "min_price",
            "is_active",
            "created_at",
        ]
    def get_product_image(self, obj):
        """Get featured image with absolute URL"""
        if obj.product.featured_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.product.featured_image.url)
            return obj.product.featured_image.url
        return None


class PriceMatrixCreateUpdateSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())

    class Meta:
        model = PriceMatrix
        fields = [
            "product",
            "wholesale_price",
            "regular_price",
            "display_price",
            "bargain_price",
            "min_price",
        ]

    def validate(self, attrs):
        # match your CheckConstraints logic, but give user-friendly msg:
        min_price = attrs.get("min_price")
        bargain = attrs.get("bargain_price")
        display = attrs.get("display_price")
        regular = attrs.get("regular_price")

        if min_price is not None and bargain is not None and min_price > bargain:
            raise serializers.ValidationError({
                "min_price": "Minimum price cannot be higher than the bargain price."
            })

        if bargain is not None and display is not None and bargain > display:
            raise serializers.ValidationError({
                "bargain_price": "Bargain price cannot be higher than the display price."
            })

        if display is not None and regular is not None and display > regular:
            raise serializers.ValidationError({
                "display_price": "Display price cannot be higher than the regular price."
            })

        return attrs

    def validate_product(self, product):
        request = self.context["request"]
        storage_location = get_manager_storage_location(request)

        #  product must exist in inventory of this storage location
        exists = Inventory.objects.filter(product=product,storagelocation=storage_location).exists()
        if not exists:
            raise serializers.ValidationError(
                "This product is not available in your storage location inventory."
            )

        return product
class PriceHistorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_image = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = PriceHistory
        fields = [
            "product",
            "product_image",
            "product_name",
            "action",
            "user",
            "user_name",
            "old_wholesale_price",
            "old_regular_price",
            "old_display_price",
            "old_bargain_price",
            "old_min_price",
            "new_wholesale_price",
            "new_regular_price",
            "new_display_price",
            "new_bargain_price",
            "new_min_price",
            "created_at",
        ]

    def get_user_name(self, obj):
        if obj.user:
            try:
                # Try fetching from StoreManagerProfile first
                if hasattr(obj.user, 'store_manager_profile'):
                    profile = obj.user.store_manager_profile
                    return f"{profile.first_name} {profile.last_name}".strip()

            except Exception:
                pass
            
            # Final fallback to username/phone
            return str(obj.user)
        return "System"
    def get_product_image(self, obj):
        """Get featured image with absolute URL"""
        if obj.product.featured_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.product.featured_image.url)
            return obj.product.featured_image.url
        return None

