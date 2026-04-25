# orders/selectors/order_selectors.py

from django.shortcuts import get_object_or_404

from ..models.orders_models import Order, OrderAddress
from delivery.models.partner_models import DeliveryBatchItems


def get_order_for_user_detail(*, order_number, user):
    return get_object_or_404(
        Order.objects.select_related("order_address", "user").prefetch_related("order_items"),
        order_number=order_number,
        user=user,
    )


def get_order_for_user_tracking(*, order_number, user):
    return get_object_or_404(
        Order.objects.select_related("user"),
        order_number=order_number,
        user=user,
    )
    
def get_delivery_man_info(*,order_number, user):
    order  = get_order_for_user_tracking(order_number=order_number ,user=user)
    try:
        devlivery_batch_item = DeliveryBatchItems.objects.get(order=order)
    except DeliveryBatchItems.DoesNotExist:
        return None
    
    return devlivery_batch_item.batch.delivery_man


def get_order_any(*, order_number):
    return get_object_or_404(Order, order_number=order_number)


def get_order_address(*, order):
    return OrderAddress.objects.get(order=order)
