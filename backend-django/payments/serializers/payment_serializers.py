from rest_framework import serializers

from ..models import Payment
from orders.utils.number_data_formater import format_amount
from decimal import Decimal

class PaymentHistorySerializer(serializers.ModelSerializer):
    # Using SerializerMethodField for custom formatting
    formatted_date = serializers.SerializerMethodField()
    display_method = serializers.CharField(
        source="get_payment_method_display", read_only=True
    )
    gateway_id = serializers.CharField(source="gateway_payment_id", read_only=True)
    # We keep 'type' so the frontend logic for colors (red/green) doesn't break
    transaction_type = serializers.SerializerMethodField()
    amount = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            "id",
            "transaction_type",
            "created_at",
            "formatted_date",
            "display_method",
            "status",
            "amount",
            "currency",
            "gateway_id",
        ]

    def get_formatted_date(self, obj):
        return obj.created_at.strftime("%d %b %Y, %I:%M %p")

    def get_transaction_type(self, obj):
        # Even if we only use the Payment model, we can treat
        # REFUNDED status as a "refund" type for UI coloring
        return "refund" if obj.status == "REFUNDED" else "payment"

    def get_amount(self, obj):
        return format_amount(Decimal(obj.amount))

