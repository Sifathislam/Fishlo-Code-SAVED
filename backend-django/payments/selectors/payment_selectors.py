from orders.models.orders_models import Order


def get_user_order_by_number(*, order_number, user):
    return Order.objects.get(order_number=order_number, user=user)


def get_user_order_by_id(*, order_id, user):
    return Order.objects.get(id=order_id, user=user)


def get_pending_payment_for_order(order):
    return order.payments.filter(status="PENDING").first()


def get_latest_payment_for_order(order):
    return order.payments.order_by("-created_at").first()
