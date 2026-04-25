# discounts/selectors/discount_selectors.py

from django.db.models import F, Q
from django.utils import timezone

from ..models.discount_model import Discount


def get_available_discounts_queryset():
    now = timezone.now()
    return (
        Discount.objects.filter(
            Q(is_active=True),
            Q(valid_from__isnull=True) | Q(valid_from__lte=now),
            Q(valid_to__isnull=True) | Q(valid_to__gte=now),
            Q(usage_limit__isnull=True) | Q(used_count__lt=F("usage_limit")),
        )
        .only(
            "code",
            "discount_type",
            "discount_percentage",
            "discount_fixed_amount",
            "max_discount",
            "min_order_amount",
            "valid_to",
            "usage_limit",
            "used_count",
        )
    )
