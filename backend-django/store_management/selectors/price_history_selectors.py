from django.db.models import Q

from ..models.price_history_models import PriceHistory


def price_history_qs(storage_location):
    return (
        PriceHistory.objects
        .select_related("product", "storage_location", "user")
        .filter(storage_location=storage_location)
    )


def price_history_filtered_qs(storage_location, *, search=None, action=None, product_id=None):
    """
    Used by export + list filtering (manual filters).
    Note: DRF SearchFilter is still fine for ListAPIView, but export needs manual filtering.
    """
    qs = price_history_qs(storage_location)

    if product_id:
        qs = qs.filter(product_id=product_id)

    if search:
        qs = qs.filter(
            Q(product__name__icontains=search) |
            Q(product__slug__icontains=search)
        )

    if action:
        qs = qs.filter(action=action)

    return qs
