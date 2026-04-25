from django.db.models import Q
from django.utils import timezone

from ..models import Banner


def get_active_banners_for_placement(placement: str):
    now = timezone.now()

    queryset = (
        Banner.objects.filter(placement=placement, is_active=True)
        .filter(
            Q(starts_at__isnull=True) | Q(starts_at__lte=now),
            Q(ends_at__isnull=True) | Q(ends_at__gte=now),
        )
        .order_by("priority", "-starts_at")
    )
    return queryset
