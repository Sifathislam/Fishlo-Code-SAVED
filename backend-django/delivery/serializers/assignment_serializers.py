# delivery/serializers/assignment_serializers.py

from rest_framework import serializers
from delivery.models.partner_models import DeliveryAssignmentBatch, DeliveryBatchItems
from orders.utils.number_data_formater import format_amount


class OrderAddressSerializer(serializers.Serializer):
    full_name      = serializers.CharField()
    phone          = serializers.CharField()
    house_details  = serializers.CharField()
    address_line_2 = serializers.CharField()
    city           = serializers.CharField()


class BatchItemOrderSerializer(serializers.Serializer):
    id                   = serializers.IntegerField()
    order_number         = serializers.CharField()
    status               = serializers.CharField()
    cash_collected       = serializers.SerializerMethodField()
    remaining_amount     = serializers.SerializerMethodField()
    delivery_charge      = serializers.SerializerMethodField()
    delivery_slot_label  = serializers.CharField()
    address              = serializers.SerializerMethodField()

    def get_address(self, order):
        addr = getattr(order, "order_address", None)
        if not addr:
            return None
        return OrderAddressSerializer(addr).data

    def get_remaining_amount(self, order):
        val = getattr(order, "remaining_amount", None)
        if val is None:
            return "0"
        return format_amount(val)

    def get_cash_collected(self, order):
        val = getattr(order, "cash_collected", None)
        if val is None:
            return "0"
        return format_amount(val)
    
    def get_delivery_charge(self, order):
        val = getattr(order, "delivery_charge", None)
        if val is None:
            return "0"
        return format_amount(val)
    

class BatchItemSerializer(serializers.ModelSerializer):
    order           = BatchItemOrderSerializer()
    is_next_delivery = serializers.SerializerMethodField()

    class Meta:
        model  = DeliveryBatchItems
        fields = ["id", "attempt_number","is_next_delivery", "order"]

    def get_is_next_delivery(self, item):
        return self.context.get("next_id") == item.id


class DeliveryBatchSerializer(serializers.ModelSerializer):
    orders       = serializers.SerializerMethodField()
    total_orders = serializers.SerializerMethodField()

    class Meta:
        model  = DeliveryAssignmentBatch
        fields = [
            "id", "batch_number", "status", "slot_label",
            "delivery_date", "total_earnings", "total_orders",
            "assigned_at", "accepted_at", "orders",
        ]

    def get_total_orders(self, batch):
        return batch.assignments.count()

    def get_orders(self, batch):
        items = list(batch.assignments.all())
        next_id = next(
            (i.id for i in items if i.order.status not in ("DELIVERED", "CANCELLED", "FAILED")),
            None,
        )
        return BatchItemSerializer(items, many=True, context={"next_id": next_id}).data

class HistoryBatchItemOrderSerializer(serializers.Serializer):
    order_number         = serializers.CharField()
    status               = serializers.CharField()
    delivery_charge      = serializers.SerializerMethodField()

    def get_delivery_charge(self, order):
        val = getattr(order, "delivery_charge", None)
        if val is None:
            return "0"
        return format_amount(val)

class HistoryBatchItemSerializer(serializers.ModelSerializer):
    order = HistoryBatchItemOrderSerializer()

    class Meta:
        model  = DeliveryBatchItems
        fields = ["id", "order"]

class DeliveryHistoryBatchSerializer(serializers.ModelSerializer):
    orders       = serializers.SerializerMethodField()
    total_orders = serializers.SerializerMethodField()

    class Meta:
        model  = DeliveryAssignmentBatch
        fields = [
            "id", "batch_number", "status", "slot_label",
            "delivery_date", "total_earnings", "total_orders",
            "completed_at", "orders",
        ]

    def get_total_orders(self, batch):
        return batch.assignments.count()

    def get_orders(self, batch):
        items = list(batch.assignments.all())
        return HistoryBatchItemSerializer(items, many=True).data