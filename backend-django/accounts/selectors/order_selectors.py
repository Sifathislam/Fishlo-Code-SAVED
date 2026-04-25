from orders.models.orders_models import Order



def get_user_dashboard_summary(user):
    return {
        "total_orders": Order.objects.filter(user=user).count(),
        "pending_orders": Order.objects.filter(user=user, status="PENDING").count(),
        "cancelled_orders": Order.objects.filter(user=user, status="CANCELLED").count(),
    }


def get_user_recent_orders(user, limit=5):
    return Order.objects.filter(user=user).order_by("-created_at")[:limit]


def get_user_orders_queryset(user):
    return Order.objects.filter(user=user).prefetch_related("order_items")
