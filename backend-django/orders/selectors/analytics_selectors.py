from django.db.models import Sum, Count, Avg, Q, F, Max, CharField, Value
from django.db.models.functions import TruncDate, Coalesce, Cast, NullIf, Replace, Right, Length

def _normalize_phone(field_expr):
    """Strip spaces, +, country code → extract last 10 digits."""
    cleaned = Replace(field_expr, Value(" "), Value(""))
    cleaned = Replace(cleaned, Value("+"), Value(""))
    # After stripping spaces and +, we have something like '919090000000' or '9090000000' or '09090000000'
    # Always take the rightmost 10 digits
    return Right(cleaned, 10)

def _unified_phone_annotation():
    """Normalize phone: always extract last 10 digits so all formats match."""
    return Coalesce(
        _normalize_phone(Cast("user__phone_number", CharField())),
        _normalize_phone(NullIf("customer_phone", Value("")))
    )
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from ..models.orders_models import Order, OrderItem
from accounts.models import UserProfile
from products.models import Product
from store_management.utils import get_safe_storage_location

VALID_STATUSES = [
    Order.OrderStatus.PENDING, Order.OrderStatus.CONFIRMED, 
    Order.OrderStatus.PROCESSING, Order.OrderStatus.PACKED, 
    Order.OrderStatus.ASSIGNING, Order.OrderStatus.ASSIGN, 
    Order.OrderStatus.OUT_FOR_DELIVERY, Order.OrderStatus.DELIVERED
]

def _base_order_qs(request, start_date, end_date):
    user_storage_location = get_safe_storage_location(request)

    qs = Order.objects.filter(
        Q(payment_status="PAID") | Q(payment_method__in=["COD", "CASH", "UPI_ON_DELIVERY"]),
        status__in=VALID_STATUSES,
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
    )

    if user_storage_location:
        qs = qs.filter(storage_location=user_storage_location)

    return qs
def get_summary_stats(request, start_date, end_date):
    """
    Returns total revenue, order count, avg order value, avg daily sale
    and their % change vs the previous equivalent period.
    """
    delta = (end_date - start_date).days + 1
    prev_start = start_date - timedelta(days=delta)
    prev_end = start_date - timedelta(days=1)

    def _agg(qs, num_days):
        result = qs.aggregate(
            revenue=Sum("total_amount"),
            orders=Count("id"),
        )
        revenue = result["revenue"] or Decimal("0.00")
        orders = result["orders"] or 0
        avg = (revenue / orders) if orders else Decimal("0.00")
        avg_daily = (revenue / num_days) if num_days else Decimal("0.00")
        return revenue, orders, avg, avg_daily

    curr_qs = _base_order_qs(request, start_date, end_date)
    prev_qs = _base_order_qs(request, prev_start, prev_end)
    
    prev_delta = (prev_end - prev_start).days + 1

    curr_rev, curr_orders, curr_avg, curr_daily = _agg(curr_qs, delta)
    prev_rev, prev_orders, prev_avg, prev_daily = _agg(prev_qs, prev_delta)

    def _pct(curr, prev):
        if not prev:
            return None
        return round(float((curr - prev) / prev * 100), 1)

    # ── Payment breakdown (Manual + Custom orders) ─────────────────
    # Both manual catalog orders and custom orders use source=MANUAL_STORE
    manual_orders = curr_qs.filter(source=Order.OrderSource.MANUAL_STORE)
    
    payment_breakdown = manual_orders.aggregate(
        cash_collected=Sum("total_amount", filter=Q(payment_method="CASH")),
        upi_collected=Sum("total_amount", filter=Q(payment_method="UPI_ONLINE")),
    )
    
    cash_collected = payment_breakdown["cash_collected"] or Decimal("0.00")
    upi_collected = payment_breakdown["upi_collected"] or Decimal("0.00")

    # ── Masala product revenue ──────────────────────────────────────
    masala_revenue = OrderItem.objects.filter(
        order__in=curr_qs,
        product__category__slug="fishlo-masala",
    ).aggregate(total=Sum("subtotal"))["total"] or Decimal("0.00")

    return {
        "total_sell": float(curr_rev),
        "total_orders": curr_orders,
        "avg_order_value": round(float(curr_avg), 2),
        "avg_daily_sale": round(float(curr_daily), 2),          # ← new
        "cash_collected": float(cash_collected),
        "upi_collected": float(upi_collected),
        "masala_revenue": float(masala_revenue),
        "sell_change_pct": _pct(curr_rev, prev_rev),
        "orders_change_pct": _pct(curr_orders, prev_orders),
        "avg_order_change_pct": _pct(curr_avg, prev_avg),
        "avg_daily_change_pct": _pct(curr_daily, prev_daily),   # ← new
    }

def get_sales_chart_data(request, start_date, end_date):
    """Daily revenue + order count for chart — includes zero-sales days."""
    
    # Fetch only days that have actual sales
    rows = (
        _base_order_qs(request,start_date, end_date)
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(day_revenue=Sum("total_amount"), orders=Count("id"))
        .order_by("day")
    )

    # Build a lookup: date -> {revenue, orders}
    data_map = {
        row["day"]: {
            "sell": float(row["day_revenue"] or 0),
            "orders": row["orders"],
        }
        for row in rows
    }

    # Generate every day in range, fill missing days with zeros
    result = []
    current = start_date
    while current <= end_date:
        day_data = data_map.get(current, {"sell": 0.0, "orders": 0})
        result.append({
            "date": current.strftime("%d"),        # "01", "02" ... for x-axis
            "full_date": current.isoformat(),      # "2026-03-16" for tooltip
            "sell": day_data["sell"],
            "orders": day_data["orders"],
        })
        current += timedelta(days=1)

    return result

def get_sales_by_category(request, start_date, end_date):
    storage_location = get_safe_storage_location(request)
    rows = (
        OrderItem.objects.filter(
            order__status__in=VALID_STATUSES,
            order__storage_location=storage_location,
            order__payment_status="PAID",
            order__created_at__date__gte=start_date,
            order__created_at__date__lte=end_date,
            product__isnull=False,
        )
        .values(category_name=F("product__category__name"))
        .annotate(sell=Sum("subtotal"))
        .order_by("-sell")
    )

    total = sum(r["sell"] or 0 for r in rows)
    return [
        {
            "category": row["category_name"] or "Uncategorised",
            "sell": float(row["sell"] or 0),
            "percentage": round(float(row["sell"] / total * 100), 1) if total else 0,
        }
        for row in rows
    ]

def get_top_products(request,start_date, end_date, limit=5):
    storage_location = get_safe_storage_location(request)
    rows = (
        OrderItem.objects.filter(
            order__status__in=VALID_STATUSES,
            order__storage_location=storage_location,
            order__payment_status="PAID",
            order__created_at__date__gte=start_date,
            order__created_at__date__lte=end_date,
            product__isnull=False,
        )
        # Use the real FK field directly, no F() annotation needed
        .values(
            "product_id",
            name=F("product__name"),
            category_name=F("product__category__name"),
        )
        .annotate(
            sell_amount=Sum("subtotal"),
            sell_count=Count("id"),
        )
        .order_by("-sell_amount")[:limit]
    )

    product_ids = [r["product_id"] for r in rows]
    from inventory.models import Inventory
    stock_map = {
        inv.product_id: inv.stock_kg
        for inv in Inventory.objects.filter(product_id__in=product_ids).only(
            "product_id", "stock_kg"
        )
    }

    LOW_STOCK_THRESHOLD = 20

    return [
        {
            "product_id": row["product_id"],
            "name": row["name"],
            "category": row["category_name"] or "—",
            "sell_amount": float(row["sell_amount"] or 0),
            "sell_count": row["sell_count"],
            "stock_kg": float(stock_map.get(row["product_id"], 0)),
            "is_low_stock": stock_map.get(row["product_id"], 0) < LOW_STOCK_THRESHOLD,
        }
        for row in rows
    ]
def get_top_customers(request, start_date, end_date, limit=5):
    """Top customers by spend in period."""
    storage_location = get_safe_storage_location(request)

    qs = Order.objects.filter(
        Q(payment_status="PAID") | Q(payment_method__in=["COD", "CASH", "UPI_ON_DELIVERY"]),
        status__in=VALID_STATUSES,
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
    ).annotate(
        unified_phone=_unified_phone_annotation()
    ).exclude(unified_phone__isnull=True)

    if storage_location:
        qs = qs.filter(storage_location=storage_location)

    rows = (
        qs.values("unified_phone")
        .annotate(
            orders=Count("id"),
            total_sell=Sum("total_amount"),
            last_order_date=Max("created_at"),
            any_user_id=Max("user_id"),
            recent_customer_name=Max("customer_name")
        )
        .order_by("-total_sell")[:limit]
    )

    user_ids = [r["any_user_id"] for r in rows if r["any_user_id"]]
    profiles = {
        p.user_id: p
        for p in UserProfile.objects.filter(user_id__in=user_ids).select_related("user").only(
            "user_id", "first_name", "last_name", "profile_image", "user__phone_number"
        )
    }

    today = timezone.localdate()

    def _last_order_label(dt):
        if not dt:
            return "—"
        d = dt.date() if hasattr(dt, "date") else dt
        diff = (today - d).days
        if diff == 0:
            return "Today"
        if diff == 1:
            return "Yesterday"
        return f"{diff} days ago"

    results = []
    for row in rows:
        phone = row["unified_phone"]
        uid = row["any_user_id"]
        # Get top items for this unified phone in this period
        top_items = OrderItem.objects.filter(
            order__in=qs.filter(unified_phone=phone)
        ).values(item_name=F("product__name")).annotate(
            qty=Sum("quantity"),
            total=Sum("subtotal")
        ).order_by("-total")[:3]

        items_list = []
        for item in top_items:
            items_list.append({
                "name": item["item_name"] or "Unknown",
                "qty": item["qty"],
                "total": float(item["total"] or 0)
            })

        profile = profiles.get(uid) if uid else None
        image_url = profile.profile_image.url if profile and profile.profile_image else None
        if image_url and request:
            image_url = request.build_absolute_uri(image_url)

        cust_name = (profile.get_full_name() if profile else "") or row["recent_customer_name"] or "Unknown User"

        results.append({
            "user_id": uid,
            "name": cust_name,
            "phone": str(phone) if phone else "—",
            "profile_image": image_url,
            "orders": row["orders"],
            "total_sell": float(row["total_sell"] or 0),
            "last_order": _last_order_label(row["last_order_date"]),
            "items": items_list,
        })
        
    return results


def get_customer_insights(request, start_date, end_date):
    """Returns total, new, returning customers and repeat rate."""
    storage_location = get_safe_storage_location(request)
    
    def _get_stats(s_date, e_date):
        base_qs = Order.objects.filter(
            Q(payment_status="PAID") | Q(payment_method__in=["COD", "CASH", "UPI_ON_DELIVERY"]),
            status__in=VALID_STATUSES,
            created_at__date__gte=s_date,
            created_at__date__lte=e_date,
        ).annotate(
            unified_phone=_unified_phone_annotation()
        )
        if storage_location:
            base_qs = base_qs.filter(storage_location=storage_location)
            
        anon_count = base_qs.filter(unified_phone__isnull=True).count()
        period_phones = set(base_qs.exclude(unified_phone__isnull=True).values_list("unified_phone", flat=True))
        total_customers = len(period_phones) + anon_count
        
        if total_customers == 0:
            return {"total": 0, "returning": 0, "new": 0}
            
        # Returning users had an order before the start date
        returning_qs = Order.objects.filter(
            Q(payment_status="PAID") | Q(payment_method__in=["COD", "CASH", "UPI_ON_DELIVERY"]),
            status__in=VALID_STATUSES,
            created_at__date__lt=s_date,
        ).annotate(
            unified_phone=_unified_phone_annotation()
        ).filter(unified_phone__in=period_phones)

        returning_phones = set(returning_qs.values_list("unified_phone", flat=True))
        returning_count = len(returning_phones)
        
        return {
            "total": total_customers,
            "returning": returning_count,
            "new": total_customers - returning_count,
            "user_ids": period_phones,
            "returning_ids": returning_phones
        }

    # Current period stats
    curr_stats = _get_stats(start_date, end_date)
    
    # Prev period stats
    delta = (end_date - start_date).days + 1
    prev_start = start_date - timedelta(days=delta)
    prev_end = start_date - timedelta(days=1)
    prev_stats = _get_stats(prev_start, prev_end)
    
    def _pct(curr, prev):
        if not prev: return None
        return round(float((curr - prev) / prev * 100), 1)

    total = curr_stats["total"]
    returning = curr_stats["returning"]
    new_cust = curr_stats["new"]
    repeat_rate = round((returning / total * 100), 1) if total > 0 else 0.0
    
    return {
        "total_unique_customers": total,
        "new_customers": new_cust,
        "returning_customers": returning,
        "repeat_rate_pct": repeat_rate,
        "new_change_pct": _pct(new_cust, prev_stats["new"]),
        "returning_change_pct": _pct(returning, prev_stats["returning"]),
        "total_change_pct": _pct(total, prev_stats["total"]),
        
        # We also pass these privately for the tables to use without re-querying
        "_curr_users": curr_stats.get("user_ids", set()),
        "_returning_ids": curr_stats.get("returning_ids", set()),
        "_request": request,
        "_base_qs": Order.objects.filter(
            Q(payment_status="PAID") | Q(payment_method__in=["COD", "CASH", "UPI_ON_DELIVERY"]),
            status__in=VALID_STATUSES,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
        ).annotate(
            unified_phone=_unified_phone_annotation()
        ).filter(storage_location=storage_location) if storage_location else Order.objects.filter(
            Q(payment_status="PAID") | Q(payment_method__in=["COD", "CASH", "UPI_ON_DELIVERY"]),
            status__in=VALID_STATUSES,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
        ).annotate(
            unified_phone=_unified_phone_annotation()
        )
    }

def get_repeat_customers_table(insights, limit=10):
    returning_ids = insights["_returning_ids"]
    base_qs = insights["_base_qs"]
    
    if not returning_ids:
        return []
        
    rows = base_qs.filter(unified_phone__in=returning_ids).values("unified_phone").annotate(
        orders=Count("id"),
        total_sell=Sum("total_amount"),
        last_order_date=Max("created_at"),
        any_user_id=Max("user_id"),
        recent_customer_name=Max("customer_name")
    ).order_by("-total_sell")[:limit]
    
    return _format_customer_rows(rows, base_qs, insights.get("_request"))

def get_new_customers_table(insights, limit=10):
    curr_users = insights["_curr_users"]
    returning_ids = insights["_returning_ids"]
    new_ids = curr_users - returning_ids
    
    if not new_ids and not insights.get("_base_qs").filter(unified_phone__isnull=True).exists():
        return []
        
    base_qs = insights["_base_qs"]
    identified_qs = base_qs.filter(unified_phone__in=new_ids).values("unified_phone").annotate(
        orders=Count("id"),
        total_sell=Sum("total_amount"),
        last_order_date=Max("created_at"),
        any_user_id=Max("user_id"),
        recent_customer_name=Max("customer_name")
    )
    
    # 2. Anonymous new customers (no phone number) — treated as individual occurrences
    anon_qs = base_qs.filter(unified_phone__isnull=True).annotate(
        any_user_id=Value(None, output_field=CharField()),
        unified_phone=Value(None, output_field=CharField()),
        orders=Value(1),
        total_sell=F("total_amount"),
        last_order_date=F("created_at"),
        recent_customer_name=F("customer_name")
    ).values(
        "unified_phone", "orders", "total_sell", "last_order_date", "any_user_id", "recent_customer_name", "id"
    )

    combined_rows = list(identified_qs) + list(anon_qs)
    
    # Sort and slice in python
    combined_rows.sort(key=lambda r: float(r["total_sell"] or 0), reverse=True)
    rows = combined_rows[:limit]
    
    return _format_customer_rows(rows, base_qs, insights.get("_request"))

def _format_customer_rows(rows, base_qs, request=None):
    user_ids = [r["any_user_id"] for r in rows if r.get("any_user_id")]
    profiles = {
        p.user_id: p
        for p in UserProfile.objects.filter(user_id__in=user_ids).select_related("user").only(
            "user_id", "first_name", "last_name", "profile_image", "user__phone_number"
        )
    }

    today = timezone.localdate()

    def _last_order_label(dt):
        if not dt: return "—"
        d = dt.date() if hasattr(dt, "date") else dt
        diff = (today - d).days
        if diff == 0: return "Today"
        if diff == 1: return "Yesterday"
        return f"{diff} days ago"

    results = []
    for row in rows:
        phone = row["unified_phone"]
        uid = row["any_user_id"]
        anon_order_id = row.get("id") # For anonymous single orders

        # Get top items
        top_items_qs = OrderItem.objects.filter(order__in=base_qs.filter(unified_phone=phone)) if phone else OrderItem.objects.filter(order_id=anon_order_id)
        
        top_items = top_items_qs.values(item_name=F("product__name")).annotate(
            qty=Sum("quantity"),
            total=Sum("subtotal")
        ).order_by("-total")[:4]

        items_list = []
        for item in top_items:
            items_list.append({
                "name": item["item_name"] or "Unknown",
                "qty": item["qty"],
                "total": float(item["total"] or 0)
            })

        profile = profiles.get(uid) if uid else None
        image_url = profile.profile_image.url if profile and profile.profile_image else None
        if image_url and request:
            image_url = request.build_absolute_uri(image_url)

        cust_name = (profile.get_full_name() if profile else "") or row["recent_customer_name"] or "Unknown User"

        results.append({
            "user_id": uid,
            "name": cust_name,
            "phone": str(phone) if phone else "—",
            "profile_image": image_url,
            "orders": row["orders"],
            "total_sell": float(row["total_sell"] or 0),
            "avg_order": float(row["total_sell"] / row["orders"]) if row["orders"] else 0,
            "last_order": _last_order_label(row["last_order_date"]),
            "items": items_list,
        })
        
    return results