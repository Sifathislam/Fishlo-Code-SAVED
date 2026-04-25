# orders/serializers/manual_order_serializers.py
from rest_framework import serializers
from products.serializers.product_serializers import CutSerializer,CategoryMinimalSerializer
from products.models.product_models import Product
from products.utils import get_location_inventory, get_location_price_matrix
from decimal import Decimal
from django.db.models import Avg

class DeliveryAddressSerializer(serializers.Serializer):
    flat_no = serializers.CharField(max_length=100)
    street = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    pincode = serializers.CharField(max_length=20)
    land_mark = serializers.CharField(max_length=255, required=False, allow_blank=True)
# orders/serializers/manual_order_serializers.py

class WeightCutSerializer(serializers.Serializer):
    cut_id = serializers.IntegerField(required=False, allow_null=True)
    weight_id = serializers.IntegerField(required=False, allow_null=True)
    custom_weight = serializers.DecimalField(max_digits=10, decimal_places=3, required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1)
    retail_price_per_kg = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)


# REPLACE old ManualProductSerializer with this:
class ManualProductSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=["catalog", "custom"], default="catalog")

    # Catalog-only
    id = serializers.IntegerField(required=False, allow_null=True)
    weight_and_cuts = WeightCutSerializer(many=True, required=False)

    # Custom-only
    name = serializers.CharField(max_length=200, required=False, allow_blank=True, allow_null=True)
    sell_type = serializers.ChoiceField(choices=["WEIGHT", "PIECE"], required=False, allow_null=True)
    weight = serializers.DecimalField(max_digits=10, decimal_places=3, required=False, allow_null=True)
    pieces = serializers.IntegerField(required=False, default=0)
    quantity = serializers.IntegerField(min_value=1, required=False, default=1)
    price_per_kg = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    cut_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default="0.00")
    note = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)

    def validate(self, data):
        product_type = data.get("type", "catalog")

        if product_type == "catalog":
            if not data.get("id"):
                raise serializers.ValidationError({"id": "This field is required for catalog products."})
            if not data.get("weight_and_cuts"):
                raise serializers.ValidationError({"weight_and_cuts": "This field is required for catalog products."})

        elif product_type == "custom":
            if not data.get("name"):
                raise serializers.ValidationError({
                    "name": "This field is required for custom products."
                })

            sell_type = data.get("sell_type")

            #Only validate weight if sell_type is WEIGHT
            if sell_type == "WEIGHT":
                weight = data.get("weight")

                if not weight or weight <= 0:
                    raise serializers.ValidationError({
                        "weight": "A valid weight is required for weight-based products."
                    })

            # Price validation (common for all)
            if not data.get("total_price") and not data.get("price_per_kg"):
                raise serializers.ValidationError({
                    "total_price": "Either total_price or price_per_kg is required."
                })

        return data


# ManualOrderCreateSerializer — only change is min_length removed from products
class ManualOrderCreateSerializer(serializers.Serializer):
    purchase_type = serializers.ChoiceField(choices=["walk_in_customer", "home_delivery"])
    customer_name = serializers.CharField(max_length=200)
    customer_phone = serializers.CharField(max_length=30)

    discount_type = serializers.ChoiceField(choices=["manual", "coupon"])
    discount_value = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default="0.00")
    discount_code = serializers.CharField(max_length=50, required=False, allow_blank=True)

    delivery_address = DeliveryAddressSerializer(required=False, allow_null=True)
    products = ManualProductSerializer(many=True, min_length=1)  # min_length=1 stays 
    payment_method = serializers.ChoiceField(choices=["cash", "upi_online"])

    def validate(self, attrs):
        if attrs["purchase_type"] == "home_delivery" and not attrs.get("delivery_address"):
            raise serializers.ValidationError({"delivery_address": "Required for home_delivery."})
        if attrs["purchase_type"] == "walk_in_customer" and attrs.get("delivery_address"):
            raise serializers.ValidationError({"delivery_address": "Must be null for walk_in_customer."})
        return attrs


class ManualOrderProductListSerializer(serializers.ModelSerializer):
    category = CategoryMinimalSerializer(read_only=True)
    featured_image = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    cuts = CutSerializer(many=True, read_only=True)
    isOutOfStock = serializers.SerializerMethodField()
    regular_price = serializers.SerializerMethodField()
    display_price = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()
    isPackedProduct = serializers.SerializerMethodField()
    product_max_stock = serializers.SerializerMethodField()
    weights = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "featured_image",
            "display_price",
            "short_description",
            "regular_price",
            "discount_percentage",
            "is_available",
            "category",
            "avg_rating",
            "cuts",
            "isOutOfStock",
            "isPackedProduct",
            "product_max_stock",
            "weights"
        ]

    def get_featured_image(self, obj):
        """Get featured image with absolute URL"""
        if obj.featured_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
            return obj.featured_image.url
        return None

    def get_avg_rating(self, obj):
        approved_reviews = obj.reviews.filter(is_approved=True)
        if approved_reviews.exists():
            avg = approved_reviews.aggregate(Avg("star"))["star__avg"]
            return round(avg, 1) if avg else 0
        return 0

    def get_isOutOfStock(self, obj):
        try:
            inventory = get_location_inventory(obj, self.context)
            if inventory:
                return inventory.is_out_of_stock()
            return True
        except Exception:
            return True

    def get_regular_price(self, obj):
        """Return regular_price as Decimal, fallback to 0"""
        try:
            price_matrix = get_location_price_matrix(obj, self.context)
            return Decimal(price_matrix.regular_price) if price_matrix else Decimal("0")
        except Exception:
            return Decimal("0")

    def get_display_price(self, obj):
        """Return display_price as Decimal, fallback to 0"""
        try:
            price_matrix = get_location_price_matrix(obj, self.context)
            return Decimal(price_matrix.display_price) if price_matrix else Decimal("0")
        except Exception:
            return Decimal("0")

    def get_discount_percentage(self, obj):
        try:
            price_matrix = get_location_price_matrix(obj, self.context)
            if not price_matrix:
                return 0

            regular_price = price_matrix.regular_price
            selling_price = price_matrix.display_price

            if regular_price and regular_price > 0 and selling_price < regular_price:
                discount = ((regular_price - selling_price) / regular_price) * 100
                return int(round(discount, 0))

            return 0
        except Exception:
            return 0
    def get_isPackedProduct(self,obj):
        if obj.sell_type =="WEIGHT":
            return False
        else:
            return True
    def get_product_max_stock(self,obj):
        inventory = get_location_inventory(obj, self.context)
        if obj.sell_type =="WEIGHT":
            return inventory.stock_kg if inventory else 0
        else:
            return inventory.stock_pieces if inventory else 0

    def get_weights(self, obj):
        qs = obj.weight_options.all().order_by("weight_kg")
        from products.serializers.product_serializers import WeightOptionSerializer
        return WeightOptionSerializer(qs, many=True).data
        