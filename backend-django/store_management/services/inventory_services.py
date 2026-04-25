from datetime import datetime, time

from django.db import IntegrityError
from django.utils.timezone import make_aware
from django.utils.dateparse import parse_date
from rest_framework.exceptions import ValidationError

from inventory.models import Inventory
from inventory.models.history_models import InventoryHistory
from products.models import Product
from products.utils import get_user_storage_location
from store_management.utils import get_safe_storage_location

from ..selectors.inventory_selectors import (
    get_inventory_queryset,
    apply_inventory_tab_filter,
)


# ----------------------------
# Storage Location Resolver
# ----------------------------
def resolve_storage_location(request):
    return get_safe_storage_location(request)


# ----------------------------
# Inventory: List Queryset
# ----------------------------
def inventory_list_queryset_service(request):
    storage_location = resolve_storage_location(request)
    if not storage_location:
        # same behavior as your view: return 400 "Storage location not found."
        raise ValidationError({"detail": "Storage location not found."})

    qs = get_inventory_queryset(storage_location)
    tab = request.query_params.get("tab", "all")
    qs = apply_inventory_tab_filter(qs, tab)
    return qs


# ----------------------------
# Inventory: Create
# ----------------------------
def inventory_create_service(request, serializer):
    storage_location = resolve_storage_location(request)
    if not storage_location:
        raise ValidationError({"detail": "Storage location not found."})

    serializer.is_valid(raise_exception=True)

    product_id = serializer.validated_data.pop("product_id")
    product = Product.objects.filter(id=product_id).first()
    if not product:
        raise ValidationError({"detail": "Invalid product_id."})

    inv = Inventory(
        product=product,
        storagelocation=storage_location,
        **serializer.validated_data,
    )

    try:
        inv.save(user=request.user)  # IMPORTANT: keep as-is
    except IntegrityError:
        raise ValidationError(
            {"detail": "Inventory already exists for this product in this location."}
        )

    return inv


# ----------------------------
# Inventory: Update
# ----------------------------
def inventory_update_service(request, instance, serializer, partial: bool):
    storage_location = resolve_storage_location(request)
    if not storage_location or instance.storagelocation_id != storage_location.id:
        raise ValidationError({"detail": "Not allowed."})

    serializer.is_valid(raise_exception=True)

    # keep your logic: ignore product_id if sent
    serializer.validated_data.pop("product_id", None)

    for k, v in serializer.validated_data.items():
        setattr(instance, k, v)

    instance.save(user=request.user)  # IMPORTANT: keep as-is
    return instance


# ----------------------------
# History: List Queryset
# ----------------------------
def inventory_history_queryset_service(request):
    storage_location = resolve_storage_location(request)
    if not storage_location:
        return InventoryHistory.objects.none()

    qs = (
        InventoryHistory.objects.filter(storage_location=storage_location)
        .select_related("product", "inventory", "updated_by")
        .order_by("-created_at")
    )

    action_type = request.query_params.get("action_type")
    if action_type and action_type != "ALL":
        qs = qs.filter(action_type=action_type)
        
    product_id = request.query_params.get("product_id")
    if product_id:
        if not Product.objects.filter(id=product_id).exists():
            return InventoryHistory.objects.none()
        qs = qs.filter(product_id=product_id)

    start = request.query_params.get("start")  # YYYY-MM-DD
    end = request.query_params.get("end")      # YYYY-MM-DD

    if start:
        d = parse_date(start)
        if d:
            # Use make_aware to handle timezone correctly
            start_dt = make_aware(datetime.combine(d, time.min))
            qs = qs.filter(created_at__gte=start_dt)
            
            # If start is provided but END is missing, treat as "Specific Date" (start <= date <= start end_of_day)
            if not end:
                end_of_day = make_aware(datetime.combine(d, time.max))
                qs = qs.filter(created_at__lte=end_of_day)

    if end:
        d = parse_date(end)
        if d:
            # Use make_aware to handle timezone correctly
            end_dt = make_aware(datetime.combine(d, time.max))
            qs = qs.filter(created_at__lte=end_dt)

    return qs
