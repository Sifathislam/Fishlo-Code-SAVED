from decimal import ROUND_HALF_UP, Decimal

from django.conf import settings
from django.db.models import Avg
from rest_framework import serializers
import requests
import math

from orders.utils.number_data_formater import format_weight

from ..models import (
    Cut,
    ImageGallery,
    Product,
    StockNotifyRequest,
    WeightOption
)
from ..utils import get_location_inventory, get_location_price_matrix, get_user_storage_location, users_current_location

from .category_serializers import (
    CategoryMinimalSerializer,
    SubCategoryMinimalSerializer,
)


# --------------------------
# CutSerializer
# --------------------------
class CutSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()

    class Meta:
        model = Cut
        fields = ["id", "name", "image", "is_free", "price"]

    def get_price(self, obj):
        if obj.is_free:
            return 0
        return float(obj.price)

class WeightOptionSerializer(serializers.ModelSerializer):
    weight = serializers.SerializerMethodField()
    display_label = serializers.SerializerMethodField()
    pieces_info = serializers.SerializerMethodField()
    net_weight_info = serializers.SerializerMethodField()

    class Meta:
        model = WeightOption
        fields = ["id", "weight", "weight_kg", "display_label", "pieces_info", "net_weight_info", "is_better_value"]

    def get_weight(self, obj):
        return format_weight(obj.weight_kg, obj.product, 0)  # your existing logic untouched

    def get_display_label(self, obj):
        if obj.label:
            return obj.label
        kg = float(obj.weight_kg)
        if kg < 1:
            g = int(kg * 1000)
            return f"{g}g"
        return f"{kg}kg"



    def get_pieces_info(self, obj):
        return {
            "min": obj.min_pieces if obj.min_pieces else 0,
            "max": obj.max_pieces if obj.max_pieces else 0,
        }
    def get_net_weight_info(self, obj):
        p = obj.product
        if not p.expected_net_weight_min_per_kg:
            return None
        kg = float(obj.weight_kg)
        min_g = int(kg * float(p.expected_net_weight_min_per_kg) * 10)
        max_g = int(kg * float(p.expected_net_weight_max_per_kg) * 10)
        return f"After cleaning ~{min_g}g – {max_g}g"
    
class ProductListSerializer(serializers.ModelSerializer):
    category = CategoryMinimalSerializer(read_only=True)
    featured_image = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    cuts = CutSerializer(many=True, read_only=True)
    isOutOfStock = serializers.SerializerMethodField()
    regular_price = serializers.SerializerMethodField()
    display_price = serializers.SerializerMethodField()
    isStockNotified = serializers.SerializerMethodField()
    isInDeliveryZone = serializers.SerializerMethodField()
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
            "min_serves",
            "max_serves",
            "min_pieces",
            "max_pieces",
            "isOutOfStock",
            "isStockNotified",
            "isInDeliveryZone",
            "isPackedProduct",
            "product_max_stock",
            "weights",
            "sell_type",
            "pack_weight_kg"
        ]

    def get_weights(self, obj):
        qs = WeightOption.objects.filter(product=obj).order_by("weight_kg")
        return WeightOptionSerializer(qs, many=True).data

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

    def get_isInDeliveryZone(self, obj):
        try:
            inventory = get_location_inventory(obj, self.context)
            if self.context.get("storage_location") is not None:
                return True
            return False
        except Exception:
            return False

    def get_isStockNotified(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return StockNotifyRequest.objects.filter(user=request.user, product=obj).exists()

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
        
# --------------------------
# ImageGallerySerializer
# --------------------------
class ImageGallerySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ImageGallery
        fields = ["id", "image"]

    def get_image(self, obj):
        if obj.image:
            request = self.context.get("request")
            return (
                request.build_absolute_uri(obj.image.url) if request else obj.image.url
            )
        return None


# --------------------------
# ProductDetailSerializer
# --------------------------
class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategoryMinimalSerializer(read_only=True)
    subcategory = SubCategoryMinimalSerializer(read_only=True)
    cuts = CutSerializer(many=True, read_only=True)
    gallery = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    total_ratings_count = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()
    isOutOfStock = serializers.SerializerMethodField()
    sku = serializers.SerializerMethodField()
    display_price = serializers.SerializerMethodField()
    regular_price = serializers.SerializerMethodField()
    isStockNotified = serializers.SerializerMethodField()
    isBargainable = serializers.SerializerMethodField()
    isInDeliveryZone = serializers.SerializerMethodField()
    isMasalaProduct = serializers.SerializerMethodField()
    weights = serializers.SerializerMethodField()
    product_max_stock = serializers.SerializerMethodField()
    inventory_id = serializers.SerializerMethodField()
    expected_net_weight = serializers.SerializerMethodField()


    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "sku",
            "short_description",
            "details",
            "display_price",
            "regular_price",
            "discount_percentage",
            "is_available",
            "category",
            "subcategory",
            "min_serves",
            "min_pieces",
            "max_serves",
            "max_pieces",
            "cuts",
            "gallery",
            "avg_rating",
            "total_ratings_count",
            "isOutOfStock",
            "isStockNotified",
            "isBargainable",
            "isInDeliveryZone",
            "isMasalaProduct",
            "weights",
            "product_max_stock",
            "inventory_id",
            "expected_net_weight",
            "sell_type",
            "pack_weight_kg"
        ]

    def get_inventory_id(self, obj):
        inventory_id = get_location_inventory(obj, self.context).id
        return inventory_id

    def get_weights(self, obj):
        qs = WeightOption.objects.filter(product=obj).order_by("weight_kg")
        return WeightOptionSerializer(qs, many=True).data

    def get_sku(self, obj):
        """Return SKU, fallback to empty string"""
        try:
            inventory = get_location_inventory(obj, self.context)
            return inventory.sku if inventory and inventory.sku else ""
        except Exception:
            return ""

    def get_display_price(self, obj):
        """Return display_price as Decimal, fallback to 0"""
        try:
            price_matrix = get_location_price_matrix(obj, self.context)
            return Decimal(price_matrix.display_price) if price_matrix else Decimal("0")
        except Exception:
            return Decimal("0")

    def get_regular_price(self, obj):
        """Return regular_price as Decimal, fallback to 0"""
        try:
            price_matrix = get_location_price_matrix(obj, self.context)
            return Decimal(price_matrix.regular_price) if price_matrix else Decimal("0")
        except Exception:
            return Decimal("0")

    def get_gallery(self, obj):
        """Get all images with featured image first"""
        request = self.context.get("request")
        images = []

        # Add featured image first
        if obj.featured_image:
            featured_url = (
                request.build_absolute_uri(obj.featured_image.url)
                if request
                else obj.featured_image.url
            )
            images.append({"id": "0", "image": featured_url, "is_featured": True})

        # Add gallery images
        for gallery_item in obj.gallery.all():
            if gallery_item.image:
                gallery_url = (
                    request.build_absolute_uri(gallery_item.image.url)
                    if request
                    else gallery_item.image.url
                )
                images.append(
                    {
                        "id": str(gallery_item.id),
                        "image": gallery_url,
                        "is_featured": False,
                    }
                )

        return images

    def get_avg_rating(self, obj):
        approved_reviews = obj.reviews.filter(is_approved=True)
        if approved_reviews.exists():
            avg = approved_reviews.aggregate(Avg("star"))["star__avg"]
            return round(avg, 1) if avg else 0
        return 0

    def get_total_ratings_count(self, obj):
        return obj.reviews.filter(is_approved=True).count()

    def get_discount_percentage(self, obj):
        """Calculate discount percentage, return 0 if no discount"""
        try:
            price_matrix = get_location_price_matrix(obj, self.context)
            if price_matrix and price_matrix.regular_price > price_matrix.display_price:
                discount = (
                    (price_matrix.regular_price - price_matrix.display_price)
                    / price_matrix.regular_price
                ) * 100
                return int(Decimal(discount).quantize(0, rounding=ROUND_HALF_UP))
            return 0
        except Exception:
            return 0

    def get_isOutOfStock(self, obj):
        try:
            inventory = get_location_inventory(obj, self.context)
            if inventory:
                return inventory.is_out_of_stock()
            return True
        except Exception:
            return True

    def get_isStockNotified(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return StockNotifyRequest.objects.filter(user=request.user, product=obj).exists()

    def get_isBargainable(self, obj):
        try:
            inventory = get_location_inventory(obj, self.context)
            if inventory:
                return inventory.is_bargainable_product()
            return False
        except Exception:
            return False

    def get_isInDeliveryZone(self, obj):
        try:
            inventory = get_location_inventory(obj, self.context)
            if self.context.get("storage_location") is not None:
                return True
            return False
        except Exception:
            return False

    def get_isMasalaProduct(self, obj):
        if obj and obj.category.slug =='fishlo-masala':
            return True
        else:
            return False
    def get_product_max_stock(self,obj):
        inventory = get_location_inventory(obj, self.context)
        if obj.sell_type =="WEIGHT":
            return inventory.stock_kg
        else:
            return inventory.stock_pieces

    def get_expected_net_weight(self, obj):
        if obj.sell_type == "PACK":
            return None

        min_pct = obj.expected_net_weight_min_per_kg
        max_pct = obj.expected_net_weight_max_per_kg

        # Both null or 0 → nothing to show
        if not min_pct and not max_pct:
            return None

        min_g = int(min_pct * 10) if min_pct is not None else None
        max_g = int(max_pct * 10) if max_pct is not None else None

        # Zero loss: both are 100% — no cleaning waste
        if min_g == 1000 and max_g == 1000:
            return "No weight loss after cleaning — you'll receive the full 1000g per 1kg"

        # Only one value set
        if min_g and not max_g:
            return f"After cleaning, you'll receive approx. {min_g}g per 1kg"
        if max_g and not min_g:
            return f"After cleaning, you'll receive approx. {max_g}g per 1kg"

        # Both set, same value
        if min_g == max_g:
            return f"After cleaning, you'll receive approx. {min_g}g per 1kg"

        return f"After cleaning, you'll receive approx. {min_g}–{max_g}g per 1kg"
       
# --------------------------
# ProductSearchSerializer
# --------------------------
class ProductSearchSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    cuts = serializers.SerializerMethodField()
    isOutOfStock = serializers.SerializerMethodField()
    wholesale_price = serializers.SerializerMethodField()
    regular_price = serializers.SerializerMethodField()
    display_price = serializers.SerializerMethodField()
    bargain_price = serializers.SerializerMethodField()
    min_price = serializers.SerializerMethodField()
    isStockNotified = serializers.SerializerMethodField()
    category = CategoryMinimalSerializer(read_only=True)
    subcategory = SubCategoryMinimalSerializer(read_only=True)
    discount_percentage = serializers.SerializerMethodField()
    isInDeliveryZone = serializers.SerializerMethodField()
    weights = serializers.SerializerMethodField()
    isPackedProduct = serializers.SerializerMethodField()
    product_max_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "image",
            "short_description",
            "cuts",
            "category",
            "subcategory",
            "wholesale_price",
            "regular_price",
            "display_price",
            "discount_percentage",
            "bargain_price",
            "min_price",
            "min_serves",
            "min_pieces",
            "max_serves",
            "max_pieces",
            "isOutOfStock",
            "isStockNotified",
            "isInDeliveryZone",
            "weights",
            "isPackedProduct",
            "product_max_stock",
            "sell_type",
            "pack_weight_kg"
        )

    def get_image(self, product):
        request = self.context.get("request")
        if product.featured_image:
            return request.build_absolute_uri(product.featured_image.url)
        return None

    def get_cuts(self, product):
        qs = product.cuts.all()
        if not qs.exists():
            return []
        return CutSerializer(qs, many=True, context=self.context).data

    def get_wholesale_price(self, obj):
        """Return wholesale_price as Decimal, fallback to 0"""
        try:
            price_matrix = get_location_price_matrix(obj, self.context)
            return Decimal(price_matrix.wholesale_price) if price_matrix else Decimal("0")
        except Exception:
            return Decimal("0")

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

    def get_bargain_price(self, obj):
        """Return bargain_price as Decimal, fallback to 0"""
        try:
            inventory = get_location_inventory(obj, self.context)
            return Decimal(inventory.bargain_price) if inventory else Decimal("0")
        except Exception:
            return Decimal("0")

    def get_min_price(self, obj):
        """Return min_price as Decimal, fallback to 0"""
        try:
            inventory = get_location_inventory(obj, self.context)
            return Decimal(inventory.min_price) if inventory else Decimal("0")
        except Exception:
            return Decimal("0")

    def get_isOutOfStock(self, obj):
        try:
            inventory = get_location_inventory(obj, self.context)
            if inventory:
                return inventory.is_out_of_stock()
            return True
        except Exception:
            return True

    def get_isStockNotified(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return StockNotifyRequest.objects.filter(user=request.user, product=obj).exists()
    def get_weights(self, obj):
        qs = WeightOption.objects.filter(product=obj).order_by("weight_kg")
        return WeightOptionSerializer(qs, many=True).data

    def get_discount_percentage(self, obj):
        """Calculate discount percentage, return 0 if no discount"""
        try:
            price_matrix = get_location_price_matrix(obj, self.context)
            if price_matrix and price_matrix.regular_price > price_matrix.display_price:
                discount = (
                    (price_matrix.regular_price - price_matrix.display_price)
                    / price_matrix.regular_price
                ) * 100
                return int(Decimal(discount).quantize(0, rounding=ROUND_HALF_UP))
            return 0
        except Exception:
            return 0

    def get_isInDeliveryZone(self, obj):
        try:
            inventory = get_location_inventory(obj, self.context)
            if self.context.get("storage_location") is not None:
                return True
            return False
        except Exception:
            return False
    def get_isPackedProduct(self,obj):
        if obj.sell_type =="WEIGHT":
            return False
        else:
            return True
    def get_product_max_stock(self,obj):
        inventory = get_location_inventory(obj, self.context)
        if obj.sell_type =="WEIGHT":
            return inventory.stock_kg
        else:
            return inventory.stock_pieces
       