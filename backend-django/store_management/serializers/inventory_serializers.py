from rest_framework import serializers
from inventory.models import Inventory
from inventory.models.history_models import InventoryHistory


class InventoryListSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_image = serializers.SerializerMethodField()

    # Table computed fields
    status = serializers.SerializerMethodField()
    min_max_display = serializers.SerializerMethodField()
    last_updated = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Inventory
        fields = [
            "id",
            "product",          # keep product id (needed for Edit)
            "product_name",
            "product_image",
            "sku",
            "stock_kg",
            "stock_pieces",
            "status",
            "min_max_display",
            "is_bargainable",
            "last_updated",
        ]

    def get_product_image(self, obj):
        """Get featured image with absolute URL"""
        if obj.product.featured_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.product.featured_image.url)
            return obj.product.featured_image.url
        return None

    def get_min_max_display(self, obj):
        # screenshot shows "2 - 3" and "1 - 1"
        if obj.min_pieces_per_kg is None and obj.max_pieces_per_kg is None:
            return "-"
        if obj.min_pieces_per_kg is not None and obj.max_pieces_per_kg is not None:
            if obj.min_pieces_per_kg == obj.max_pieces_per_kg:
                return str(obj.min_pieces_per_kg)
            return f"{obj.min_pieces_per_kg} - {obj.max_pieces_per_kg}"
        # if one side missing
        return str(obj.min_pieces_per_kg or obj.max_pieces_per_kg)

    def get_status(self, obj):
        # Match screenshots (interpreting min/max as stock threshold for "low stock")
        sell_type = getattr(obj.product, "sell_type", None)

        current_qty = obj.stock_kg if sell_type == "WEIGHT" else (obj.stock_pieces or 0)
        min_level = 5 if sell_type == "WEIGHT" else 10

        if current_qty <= 0:
            return "OUT_OF_STOCK"
        if min_level and current_qty < min_level:
            return "LOW_STOCK"
        return "IN_STOCK"


class InventoryCreateUpdateSerializer(serializers.ModelSerializer):
    # frontend sends product_id
    product_id = serializers.IntegerField(write_only=True, required=True)

    class Meta:
        model = Inventory
        fields = [
            "product_id",
            "sku",
            "stock_kg",
            "stock_pieces",
            "min_pieces_per_kg",
            "max_pieces_per_kg",
            "is_bargainable",
        ]

    def validate(self, attrs):
        # Ensure safe numeric defaults
        if attrs.get("stock_pieces") is None:
            attrs["stock_pieces"] = 0
        if attrs.get("stock_kg") is None:
            attrs["stock_kg"] = 0

        # Optional: if min/max given, ensure min <= max
        mn = attrs.get("min_pieces_per_kg")
        mx = attrs.get("max_pieces_per_kg")
        if mn is not None and mx is not None and mn > mx:
            raise serializers.ValidationError("Min value cannot be greater than Max value.")
        return attrs


class InventoryHistoryListSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    sku = serializers.CharField(source="inventory.sku", read_only=True)
    user_name = serializers.SerializerMethodField()

    # For UI columns
    old_weight = serializers.SerializerMethodField()
    change = serializers.SerializerMethodField()

    class Meta:
        model = InventoryHistory
        fields = [
            "id",
            "created_at",
            "product_name",
            "sku",
            "action_type",
            "old_weight",
            "change",
            "user_name",
            "notes",
        ]

    def get_user_name(self, obj):
        if not obj.updated_by:
            return "System"
        full_name = getattr(obj.updated_by, "get_full_name", lambda: "")() or ""
        return full_name.strip() or getattr(obj.updated_by, "email", "User")

    def get_old_weight(self, obj):
        # Show kg if it changed; otherwise pieces (simple for UI)
        if obj.stock_kg_before != obj.stock_kg_after:
            return f"{obj.stock_kg_before} kg"
        # pieces fields are DecimalField in your model; show as int-ish
        return f"{int(obj.stock_pieces_before)} pcs"

    def get_change(self, obj):
        # Prefer kg change if changed, else pieces
        if obj.stock_kg_before != obj.stock_kg_after:
            diff = obj.stock_kg_after - obj.stock_kg_before
            sign = "+" if diff > 0 else ""
            return f"{sign}{diff} kg"
        diff = obj.stock_pieces_after - obj.stock_pieces_before
        sign = "+" if diff > 0 else ""
        return f"{sign}{int(diff)} pcs"
