from rest_framework import serializers
from decimal import Decimal
from .models.orders_models import Order, OrderAddress, OrderItem, OrderTracking
from .utils.number_data_formater import format_amount,format_weight 
from products.serializers import CutSerializer
from delivery.models.partner_models import DeliveryPartnerProfile

class OrderItemSerializer(serializers.ModelSerializer):
    product_image = serializers.SerializerMethodField()
    weight = serializers.SerializerMethodField()
    product_slug = serializers.SerializerMethodField()
    selected_cuts = CutSerializer(many=True, read_only=True)
    expected_net_weight = serializers.SerializerMethodField()
    is_packed = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_name",
            "product_image",
            "quantity",
            "weight",
            "unit_price",
            "subtotal",
            "product_slug",
            "selected_cuts",
            "expected_net_weight",
            "is_custom",
            "custom_note",
            "cut_price",
            "sell_type",
            "is_packed",
            "weight_option_label_snapshot"
        ]

    def get_is_packed(self, obj):
        return obj.sell_type in ("PIECE", "PACK") if obj.sell_type else False


    def get_product_image(self, obj):

        if obj.product_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.product_image.url)
            return obj.product_image.url
        return

    def get_weight(self, obj):
        # First priority: show snapshot label if available
        if obj.weight_option_label_snapshot:
            return obj.weight_option_label_snapshot

        # Existing logic (fallback)
        if obj.is_custom:
            class DummyProduct:
                sell_type = 'WEIGHT' if getattr(obj, 'weight', 0) > 0 else 'PIECE'
            return format_weight(obj.product_weight or obj.weight, DummyProduct(), obj.quantity)
        return format_weight(obj.product_weight, obj.product, obj.quantity)

    def get_product_slug(self, obj):
        return obj.product.slug if obj.product else None

    def get_expected_net_weight(self, obj):
        if obj.product and obj.product.sell_type == "PACK":
            return None

        min_pct = obj.expected_net_weight_min_per_kg_snapshot 
        max_pct = obj.expected_net_weight_max_per_kg_snapshot 

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
       

class OrderSerializer(serializers.ModelSerializer):
    # This allows multiple items per order
    order_items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.SerializerMethodField()
    order_invoice_pdf = serializers.SerializerMethodField()
    is_partial_pay = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    delivery_date = serializers.SerializerMethodField()
    partial_pay = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    payment_method_display = serializers.SerializerMethodField()
    
    

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "status_display",
            "created_at",
            "total_amount",
            "estimated_delivery_date",
            "delivery_date",
            "order_invoice_pdf",
            "is_partial_pay",
            "partial_pay",
            "remaining_amount",
            "source",
            "payment_method_display",
            'payment_status',
            "order_items",
        ]

    def get_payment_method_display(self, obj):
        return dict(Order.PAYMENT_METHOD_CHOICES).get(
            obj.payment_method, obj.payment_method
        )

    def get_order_invoice_pdf(self, obj):
        if obj.invoice_pdf:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.invoice_pdf.url)
            return obj.invoice_pdf.url
        return

    def get_is_partial_pay(self, obj):
        return obj.partial_pay > 0
    
    def get_total_amount(self, obj):
        return format_amount(Decimal(obj.total_amount))

    def get_delivery_date(self, obj):
        return obj.get_delivery_date()

    def get_partial_pay(self, obj):
        return format_amount(Decimal(obj.partial_pay))

    def get_remaining_amount(self, obj):
        return format_amount(Decimal(obj.remaining_amount))
    
    def get_status_display(self, obj):
        if (
            obj.status == obj.OrderStatus.PENDING and
            obj.payment_status != "PENDING"
        ):
            return "Order Placed"   
        return obj.get_status_display()
class OrderSummarySerializer(serializers.ModelSerializer):
    # Matches the 'STATUS' column in your UI (e.g., "Processing")
    status_display = serializers.SerializerMethodField()
    # Formats the date to match "Feb 24, 2025"
    date = serializers.DateTimeField(source="created_at", format="%b %d, %Y", read_only=True)
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ["id", "order_number", "date", "status_display", "total_amount"]
  
    def get_total_amount(self, obj):
        return format_amount(Decimal(obj.total_amount))

    def get_status_display(self, obj):
        if (
            obj.status == obj.OrderStatus.PENDING and
            obj.payment_status != "PENDING"
        ):
            return "Order Placed"   
        return obj.get_status_display()

class OrderAddressDetailSerializer(serializers.ModelSerializer):
    """Serializer for complete address information"""

    full_address = serializers.SerializerMethodField()

    class Meta:
        model = OrderAddress
        fields = ["full_name", "phone", "email", "full_address", "address_type"]

    def get_full_address(self, obj):
        """Format complete address as single string"""
        return obj.get_full_address()


class OrderDetailSerializer(serializers.ModelSerializer):
    """Complete order details serializer"""

    order_items = OrderItemSerializer(many=True, read_only=True)
    address = OrderAddressDetailSerializer(source="order_address", read_only=True)
    payment_method_display = serializers.SerializerMethodField()

    # Price breakdown
    price_details = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "order_number",
            "estimated_delivery_date",
            "delivery_slot_label",
            "payment_method_display",
            "address",
            "order_items",
            "price_details",
        ]

    def get_payment_method_display(self, obj):
        """Return readable payment method"""
        return dict(Order.PAYMENT_METHOD_CHOICES).get(
            obj.payment_method, obj.payment_method
        )

    def get_price_details(self, obj):
        """Calculate and return price breakdown"""
        is_partial_pay = obj.partial_pay > 0

        return {
            "subtotal": format_amount(obj.subtotal),
            "delivery_fee": format_amount(obj.delivery_charge),
            # VAT / GST
            "gst_percentage": format_amount(obj.vat_percentage),
            "gst_amount": format_amount(obj.vat_amount),
            # Discount
            "discount_code": obj.discount_code or "",
            "discount_value": format_amount(obj.discount_amount or 0),
            # Partial payment
            "is_partial_pay": is_partial_pay,
            "partial_pay": format_amount(obj.partial_pay),
            "cash_collected": format_amount(obj.cash_collected),
            "remaining_amount": format_amount(obj.remaining_amount),
            "adjustable_amount":format_amount(obj.adjustable_amount),

            # Final
            "total_paid": format_amount(obj.total_amount),
            "total_amount": format_amount(obj.total_amount),
        }


class OrderTrackingSerializer(serializers.ModelSerializer):
    """Serializer for individual tracking record"""
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    updated_by = serializers.SerializerMethodField()

    class Meta:
        model = OrderTracking
        fields = [
            "status",
            "status_display",
            "timestamp",
            "location",
            "notes",
            "details",
            "updated_by",
        ]

    def get_updated_by(self, obj):
        if not obj.updated_by:
            return "System"
        
        user = obj.updated_by
        
        # Check for Store Manager
        try:
             if user.store_manager_profile:
                return f"{user.store_manager_profile.first_name} {user.store_manager_profile.last_name} (Store Manager)"
        except Exception:
            pass
        
        # Check for Delivery Partner
        try:
            if user.delivery_partner_profile:
                 return f"{user.delivery_partner_profile.first_name} {user.delivery_partner_profile.last_name} (Delivery Partner)"
        except Exception:
            pass

        # Check for Admin/Staff
        if user.is_staff or user.is_superuser:
            name = user.get_full_name() or user.username
            return f"{name} (Admin)"
            
        # Fallback for customers or others
        return f"{user.get_full_name() or user.username}"


class OrderTrackingTimelineSerializer(serializers.Serializer):
    status = serializers.CharField()
    status_display = serializers.CharField()
    completed = serializers.BooleanField()
    timestamp = serializers.DateTimeField(allow_null=True)
    is_current = serializers.BooleanField()

    assignToDelivery = serializers.SerializerMethodField()

    def get_assignToDelivery(self, obj):
        """
        True only when:
        - status is packed_assigning
        - delivery man is assigned
        TODO Needs handle this
        """
        is_completed = getattr(obj, 'completed', False) if not isinstance(obj, dict) else obj.get('completed', False)
        status_code = getattr(obj, 'status', '') if not isinstance(obj, dict) else obj.get('status', '')

        if status_code == "packed_assigning" and is_completed:
            return True
        return False

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if data["status"] != "packed_assigning":
            data.pop("assignToDelivery", None)

        return data

class DeliveryManInfoSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    phone_number = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryPartnerProfile
        fields = ['profile_image','name', 'phone_number', 'is_active_duty', 'vehicle_type']

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_phone_number(self, obj):
        return str(obj.user.phone_number) 

    def get_profile_image(self, obj):
        if obj.user.profile.profile_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.user.profile.profile_image.url)
            return obj.user.profile.profile_image.url
        return None
