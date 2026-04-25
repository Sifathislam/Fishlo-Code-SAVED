from rest_framework import serializers
from .models.orders_models import Order, OrderAddress
from .serializers import OrderItemSerializer
from .utils.number_data_formater import format_amount,format_weight     
from .templatetags.weight_filters import format_weight_kg
class StoreOrderAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderAddress
        fields = ['full_name', 'phone', 'get_full_address']


class StoreOrderSerializer(serializers.ModelSerializer):
    customer = StoreOrderAddressSerializer(source='order_address', read_only=True)
    items = OrderItemSerializer(source='order_items', many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    estimated_delivery_date = serializers.DateField(format="%Y-%m-%d", read_only=True)
    delivery_date = serializers.SerializerMethodField()
    price_details = serializers.SerializerMethodField()
    total_weight = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'customer',
            'items',
            'payment_status',
            'payment_status_display',
            'payment_method',
            'source',
            'status',
            'status_display',
            'created_at',
            'total_weight',
            'estimated_delivery_date',
            'delivery_date',
            'notes',
            'cancellation_reason',
            "price_details"
        ]

    def get_delivery_date(self, obj):
        return f"{obj.estimated_delivery_date if obj.estimated_delivery_date else ''}  {obj.delivery_slot_label if obj.delivery_slot_label else ''}"


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
    def get_total_weight(sef, obj):
        return format_weight_kg(obj.total_weight)
