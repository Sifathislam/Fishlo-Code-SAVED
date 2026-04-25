from django.db.models import Avg, Count, Q, F, FloatField, ExpressionWrapper
from django.db.models.functions import ExtractHour, ExtractWeekDay, TruncWeek
from django.utils import timezone
from datetime import timedelta

from ..models.orders_models import Order, OrderTracking
from payments.models import Refund
from delivery.models.partner_models import (
    DeliveryBatchItems, DeliveryLog, DeliveryPartnerProfile
)
from products.utils import get_user_storage_location
from store_management.utils import get_safe_storage_location
from django.db.models import Subquery, OuterRef, DurationField
from django.db.models.functions import ExtractHour, ExtractWeekDay
import pytz


def _tracking_ts(status):
    """Subquery helper label for tracking timestamp by status."""
    return OrderTracking.objects.filter(
        order=OuterRef("pk"), status=status, timestamp__isnull=False
    ).values("timestamp")[:1]


def get_bi_summary(request, start_date, end_date):
    """
    Avg packing time, avg delivery time, return rate + % change vs prev period.
    """
    storage_location = get_safe_storage_location(request)

    delta = (end_date - start_date).days + 1
    prev_start = start_date - timedelta(days=delta)
    prev_end   = start_date - timedelta(days=1)

    def _base(sd, ed):
        qs = Order.objects.filter(
            status=Order.OrderStatus.DELIVERED,
            created_at__date__gte=sd,
            created_at__date__lte=ed,
        )
        if storage_location:
            qs = qs.filter(storage_location=storage_location)
        return qs

    def _avg_minutes(sd, ed, from_status, to_status):
        """Average minutes between two tracking statuses."""
        from_ts = Subquery(
            OrderTracking.objects.filter(
                order=OuterRef("pk"), status=from_status, timestamp__isnull=False
            ).values("timestamp")[:1]
        )
        to_ts = Subquery(
            OrderTracking.objects.filter(
                order=OuterRef("pk"), status=to_status, timestamp__isnull=False
            ).values("timestamp")[:1]
        )
        result = (
            _base(sd, ed)
            .annotate(from_ts=from_ts, to_ts=to_ts)
            .filter(from_ts__isnull=False, to_ts__isnull=False)
            .annotate(
                diff=ExpressionWrapper(
                    F("to_ts") - F("from_ts"),
                    output_field=DurationField()
                )
            )
            .aggregate(avg=Avg("diff"))
        )
        duration = result["avg"]
        return round(duration.total_seconds() / 60, 1) if duration else None

    def _return_rate(sd, ed):
        total = _base(sd, ed).count()
        if not total:
            return 0.0
        refunded = Refund.objects.filter(
            status="SUCCESS",
            order__created_at__date__gte=sd,
            order__created_at__date__lte=ed,
        )
        if storage_location:
            refunded = refunded.filter(order__storage_location=storage_location)
        return round(refunded.count() / total * 100, 2)

    def _pct_change(curr, prev):
        if prev is None or prev == 0:
            return None
        return round((curr - prev) / prev * 100, 1)

    curr_pack = _avg_minutes(start_date, end_date, "PROCESSING", "PACKED")
    prev_pack = _avg_minutes(prev_start, prev_end, "PROCESSING", "PACKED")

    curr_del = _avg_minutes(start_date, end_date, "OUT_FOR_DELIVERY", "DELIVERED")
    prev_del = _avg_minutes(prev_start, prev_end, "OUT_FOR_DELIVERY", "DELIVERED")

    curr_ret = _return_rate(start_date, end_date)
    prev_ret = _return_rate(prev_start, prev_end)

    return {
        "avg_packing_time_min":    curr_pack,
        "avg_delivery_time_min":   curr_del,
        "return_rate_pct":         curr_ret,
        "packing_change_pct":      _pct_change(curr_pack, prev_pack),
        "delivery_change_pct":     _pct_change(curr_del, prev_del),
        "return_rate_change_pct":  _pct_change(curr_ret, prev_ret),
    }


def get_operational_efficiency(request, start_date, end_date):
    """
    Avg packing + delivery time grouped by weekday (Mon=2 … Sun=1 in Django).
    Returns list ordered Mon–Sun.
    """
    storage_location = get_safe_storage_location(request)

    def _base():
        qs = Order.objects.filter(
            status=Order.OrderStatus.DELIVERED,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
        )
        if storage_location:
            qs = qs.filter(storage_location=storage_location)
        return qs

    pack_from = Subquery(OrderTracking.objects.filter(
        order=OuterRef("pk"), status="PROCESSING", timestamp__isnull=False
    ).values("timestamp")[:1])

    pack_to = Subquery(OrderTracking.objects.filter(
        order=OuterRef("pk"), status="PACKED", timestamp__isnull=False
    ).values("timestamp")[:1])

    del_from = Subquery(OrderTracking.objects.filter(
        order=OuterRef("pk"), status="OUT_FOR_DELIVERY", timestamp__isnull=False
    ).values("timestamp")[:1])

    del_to = Subquery(OrderTracking.objects.filter(
        order=OuterRef("pk"), status="DELIVERED", timestamp__isnull=False
    ).values("timestamp")[:1])

    rows = (
        _base()
        .annotate(
            pack_from=pack_from, pack_to=pack_to,
            del_from=del_from,   del_to=del_to,
        )
        .filter(pack_from__isnull=False, pack_to__isnull=False)
        .annotate(
            weekday=ExtractWeekDay("created_at"),
            pack_diff=ExpressionWrapper(F("pack_to") - F("pack_from"), output_field=DurationField()),
            del_diff=ExpressionWrapper(F("del_to") - F("del_from"),   output_field=DurationField()),
        )
        .values("weekday")
        .annotate(
            avg_pack=Avg("pack_diff"),
            avg_del=Avg("del_diff"),
        )
        .order_by("weekday")
    )

    # Django ExtractWeekDay: 1=Sunday, 2=Monday … 7=Saturday
    DAY_MAP = {2: "Mon", 3: "Tue", 4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat", 1: "Sun"}
    ORDER   = [2, 3, 4, 5, 6, 7, 1]

    data = {
        row["weekday"]: {
            "packing_min":  round(row["avg_pack"].total_seconds() / 60, 1) if row["avg_pack"] else 0,
            "delivery_min": round(row["avg_del"].total_seconds()  / 60, 1) if row["avg_del"]  else 0,
        }
        for row in rows
    }

    return [
        {
            "day":          DAY_MAP[d],
            "packing_min":  data.get(d, {}).get("packing_min",  0),
            "delivery_min": data.get(d, {}).get("delivery_min", 0),
        }
        for d in ORDER
    ]

def get_store_volume_heatmap(request, start_date, end_date):
    storage_location = get_safe_storage_location(request)

    qs = Order.objects.filter(
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
    )
    if storage_location:
        qs = qs.filter(storage_location=storage_location)

    # Use IST timezone for hour extraction (UTC+5:30)
    IST = pytz.timezone("Asia/Kolkata")

    rows = (
        qs.annotate(
            # Convert UTC → IST before extracting hour
            hour=ExtractHour("created_at", tzinfo=IST),
            weekday=ExtractWeekDay("created_at", tzinfo=IST),
        )
        .values("hour", "weekday")
        .annotate(count=Count("id"))
    )

    # Build lookup
    grid = {}
    for row in rows:
        grid[(row["weekday"], row["hour"])] = row["count"]

    # Dynamically build hours from store's opening/closing time
    # Fallback to 9am-9pm if not set
    if storage_location and storage_location.opening_time and storage_location.closing_time:
        open_hour  = storage_location.opening_time.hour
        close_hour = storage_location.closing_time.hour
    else:
        open_hour  = 9
        close_hour = 21

    # Build hourly range from open to close
    HOURS = list(range(open_hour, close_hour + 1))

    def _hour_label(h):
        if h == 0:   return "12am"
        if h == 12:  return "12pm"
        if h < 12:   return f"{h}am"
        return f"{h - 12}pm"

    HOUR_LABELS = {h: _hour_label(h) for h in HOURS}

    # Django ExtractWeekDay: 1=Sun, 2=Mon … 7=Sat
    DAYS    = [2, 3, 4, 5, 6, 7, 1]
    DAY_MAP = {2: "M", 3: "T", 4: "W", 5: "T", 6: "F", 7: "S", 1: "S"}

    return {
        "hours": [HOUR_LABELS[h] for h in HOURS],
        "days":  [DAY_MAP[d] for d in DAYS],
        "open_hour":  open_hour,
        "close_hour": close_hour,
        "grid": [
            {
                "hour":   HOUR_LABELS[h],
                "values": [grid.get((d, h), 0) for d in DAYS]
            }
            for h in HOURS
        ]
    }
def get_customer_retention(request, start_date, end_date):
    from django.db.models import Min
    from collections import defaultdict

    storage_location = get_safe_storage_location(request)

    qs = Order.objects.filter(
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
        user__isnull=False,
    )
    if storage_location:
        qs = qs.filter(storage_location=storage_location)

    # Get all user_ids active in this period
    all_user_ids = list(qs.values_list("user_id", flat=True).distinct())

    # Get each user's very first order date (globally, not just this period)
    first_order_map = {
        r["user_id"]: r["first"].date()
        for r in Order.objects.filter(user_id__in=all_user_ids)
        .values("user_id")
        .annotate(first=Min("created_at"))  # ✅ just Min, no .asc()
    }

    # Get all orders in period grouped by week + user
    rows = (
        qs.annotate(week=TruncWeek("created_at"))
        .values("week", "user_id")
        .distinct()
        .order_by("week")
    )

    def _week_start(dt):
        """Return Monday of the week containing dt."""
        d = dt.date() if hasattr(dt, "date") else dt
        return d - timedelta(days=d.weekday())

    week_new = defaultdict(int)
    week_ret = defaultdict(int)

    for row in rows:
        week = _week_start(row["week"])
        uid  = row["user_id"]
        first = first_order_map.get(uid)

        # New = their very first order ever falls in this week
        if first and _week_start(first) == week:
            week_new[week] += 1
        else:
            week_ret[week] += 1

    all_weeks = sorted(set(list(week_new.keys()) + list(week_ret.keys())))

    return [
        {
            "week": f"W{i+1}",
            "new": week_new.get(w, 0),
            "returning": week_ret.get(w, 0),
            "new_pct": round(
                week_new.get(w, 0) / (week_new.get(w, 0) + week_ret.get(w, 0)) * 100, 1
            ) if (week_new.get(w, 0) + week_ret.get(w, 0)) else 0,
            "retention_pct": round(
                week_ret.get(w, 0) / (week_new.get(w, 0) + week_ret.get(w, 0)) * 100, 1
            ) if (week_new.get(w, 0) + week_ret.get(w, 0)) else 0,
        }
        for i, w in enumerate(all_weeks)
    ]

def get_rider_performance(request, start_date, end_date):
    """
    Per rider: delivery count, avg delivery speed (minutes), success rate.
    No rating model exists — using success rate as quality score.
    """
    storage_location = get_safe_storage_location(request)

    del_from = Subquery(OrderTracking.objects.filter(
        order=OuterRef("order_id"), status="OUT_FOR_DELIVERY", timestamp__isnull=False
    ).values("timestamp")[:1])

    del_to = Subquery(OrderTracking.objects.filter(
        order=OuterRef("order_id"), status="DELIVERED", timestamp__isnull=False
    ).values("timestamp")[:1])

    batch_qs = DeliveryBatchItems.objects.filter(
        batch__delivery_date__gte=start_date,
        batch__delivery_date__lte=end_date,
        batch__delivery_man__isnull=False,
    )
    if storage_location:
        batch_qs = batch_qs.filter(
            order__storage_location=storage_location
        )

    rows = (
        batch_qs
        .annotate(del_from=del_from, del_to=del_to)
        .annotate(
            diff=ExpressionWrapper(
                F("del_to") - F("del_from"), output_field=DurationField()
            )
        )
        .values("batch__delivery_man_id")
        .annotate(
            total_orders=Count("id"),
            delivered=Count("id", filter=Q(order__status="DELIVERED")),
            avg_speed=Avg("diff"),
        )
        .order_by("-delivered")
    )

    partner_ids = [r["batch__delivery_man_id"] for r in rows]
    profiles = {
        p.id: p
        for p in DeliveryPartnerProfile.objects.filter(id__in=partner_ids)
        .only("id", "first_name", "last_name")
    }

    result = []
    for row in rows:
        pid     = row["batch__delivery_man_id"]
        profile = profiles.get(pid)
        total   = row["total_orders"]
        delivered = row["delivered"]
        success_rate = round(delivered / total * 100, 1) if total else 0
        avg_min = round(row["avg_speed"].total_seconds() / 60, 1) if row["avg_speed"] else None
        # Efficiency score: 0-100 based on speed (target=30min) + success rate
        speed_score = max(0, min(100, round((1 - (avg_min or 30) / 60) * 100))) if avg_min else 0
        efficiency  = round((speed_score * 0.5) + (success_rate * 0.5), 1)

        result.append({
            "rider_id":      pid,
            "name":          f"{profile.first_name} {profile.last_name}" if profile else "Unknown",
            "orders":        delivered,
            "success_rate":  success_rate,
            "avg_speed_min": avg_min,
            "efficiency_score": efficiency,
        })

    return result