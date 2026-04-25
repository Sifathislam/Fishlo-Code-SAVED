from django.db.models import Count, Prefetch, Q

from inventory.models import Inventory

from ..models import Cut, Product, RecentlyViewed, PriceMatrix
from ..utils import get_user_storage_location
from django.db.models import Case, When, OuterRef, Subquery
from django.db.models import Case, When, DecimalField as DjangoDecimalField, Subquery, OuterRef

_NOT_SET = object()

def get_products_list_queryset(request, manual_order_page=None, storage_location=_NOT_SET):
    category_slug = request.query_params.get("category", None)
    subcategory_slug = request.query_params.get("subcategory", None)
    in_stock = request.query_params.get("in_stock", None)
    sort_by = request.query_params.get("sort", None)

    if storage_location is _NOT_SET:
        storage_location = get_user_storage_location(request)
    inventory_prefetch = Prefetch(
        "inventory",
        queryset=(
            Inventory.objects.filter(storagelocation=storage_location)
            if storage_location
            else Inventory.objects.all()
        ),
        to_attr="location_inventory",
    )

    if manual_order_page:
        queryset = (
            Product.objects.filter(deleted_at__isnull=True, is_available=True)
            .select_related("category", "subcategory")
            .prefetch_related("reviews", inventory_prefetch)
        )
    else:
        queryset = (
            Product.objects.filter(deleted_at__isnull=True, is_available=True)
            .select_related("category", "subcategory")
            .prefetch_related("reviews", inventory_prefetch)
            .exclude(
                category__slug=("fishlo-masala" if category_slug != "fishlo-masala" else "")
            )
        )

    if storage_location:
        queryset = queryset.filter(inventory__storagelocation=storage_location).distinct()

    if category_slug:
        queryset = queryset.filter(category__slug=category_slug)

    if subcategory_slug:
        queryset = queryset.filter(subcategory__slug=subcategory_slug)

    if in_stock == 'true':
        if storage_location:
            in_stock_q = (
                Q(sell_type="WEIGHT", inventory__stock_kg__gt=0, inventory__storagelocation=storage_location) |
                Q(~Q(sell_type="WEIGHT"), inventory__stock_pieces__gt=0, inventory__storagelocation=storage_location)
            )
        else:
            in_stock_q = (
                Q(sell_type="WEIGHT", inventory__stock_kg__gt=0) |
                Q(~Q(sell_type="WEIGHT"), inventory__stock_pieces__gt=0)
            )
        queryset = queryset.filter(in_stock_q).distinct()

    # ── Sorting ──
    if sort_by in ['price_low_high', 'price_high_low']:
        pm_subquery = PriceMatrix.objects.filter(product=OuterRef('pk'), is_active=True)
        if storage_location:
            pm_subquery = pm_subquery.filter(storage_location=storage_location)
        queryset = queryset.annotate(
            annotated_price=Subquery(pm_subquery.values('display_price')[:1])
        )
        order = 'annotated_price' if sort_by == 'price_low_high' else '-annotated_price'
        queryset = queryset.order_by(order, 'name')

    elif sort_by == 'name_a_z':
        queryset = queryset.order_by('name')

    elif sort_by == 'name_z_a':
        queryset = queryset.order_by('-name')

    else:
        # Default: annotate effective stock, order high→low (0 stock naturally falls to bottom)
        inv_qs = Inventory.objects.filter(product=OuterRef('pk'))
        if storage_location:
            inv_qs = inv_qs.filter(storagelocation=storage_location)

        queryset = queryset.annotate(
            effective_stock=Subquery(
                inv_qs.annotate(
                    stock=Case(
                        When(product__sell_type="WEIGHT", then="stock_kg"),
                        default="stock_pieces",
                        output_field=DjangoDecimalField(),
                    )
                ).values('stock')[:1],
                output_field=DjangoDecimalField(),
            )
        ).order_by('-effective_stock', 'name')

    return queryset


def get_most_loved_products_queryset(request):
    storage_location = get_user_storage_location(request)
    inventory_prefetch = Prefetch(
        "inventory",
        queryset=(
            Inventory.objects.filter(storagelocation=storage_location)
            if storage_location
            else Inventory.objects.all()
        ),
        to_attr="location_inventory",
    )

    queryset = (
        Product.objects.filter(deleted_at__isnull=True, is_available=True)
        .select_related("category", "subcategory")
        .prefetch_related("reviews", inventory_prefetch)
        .exclude(category__slug="fishlo-masala")
    )

    if storage_location:
        # Combine location + stock check in ONE filter to avoid multiple JOIN issues
        in_stock_q = (
            Q(sell_type="WEIGHT", inventory__stock_kg__gt=0, inventory__storagelocation=storage_location) |
            Q(~Q(sell_type="WEIGHT"), inventory__stock_pieces__gt=0, inventory__storagelocation=storage_location)
        )
    else:
        in_stock_q = (
            Q(sell_type="WEIGHT", inventory__stock_kg__gt=0) |
            Q(~Q(sell_type="WEIGHT"), inventory__stock_pieces__gt=0)
        )

    queryset = queryset.filter(in_stock_q).distinct()

    queryset = queryset.annotate(total_orders=Count("orderitem")).order_by("-total_orders")

    return queryset

def get_recently_viewed_products_queryset(request):
    user = request.user

    recent_view_ids = (
        RecentlyViewed.objects.filter(user=user)
        .values_list("product_id", flat=True)
        .order_by("-viewed_at")
    )

    if not recent_view_ids:
        return Product.objects.none()

    storage_location = get_user_storage_location(request)
    inventory_prefetch = Prefetch(
        "inventory",
        queryset=(
            Inventory.objects.filter(storagelocation=storage_location)
            if storage_location
            else Inventory.objects.all()
        ),
        to_attr="location_inventory",
    )

    queryset = (
        Product.objects.filter(
            id__in=recent_view_ids, deleted_at__isnull=True, is_available=True
        )
        .select_related(
            "category",
            "subcategory",
        )
        .prefetch_related("reviews", "cuts", inventory_prefetch)
    )

    queryset = sorted(queryset, key=lambda p: list(recent_view_ids).index(p.id))

    return queryset


def get_product_search_queryset(request):
    q = (request.query_params.get("q") or "").strip()
    limit = request.query_params.get("limit") or 20
    try:
        limit = max(1, min(200, int(limit)))
    except Exception:
        limit = 20

    storage_location = get_user_storage_location(request)
    inventory_prefetch = Prefetch(
        "inventory",
        queryset=(
            Inventory.objects.filter(storagelocation=storage_location)
            if storage_location
            else Inventory.objects.all()
        ),
        to_attr="location_inventory",
    )

    base_queryset = Product.objects.filter(is_available=True)

    if storage_location:
        base_queryset = base_queryset.filter(inventory__storagelocation=storage_location).distinct()

    if q:
        queryset = base_queryset.filter(
            Q(name__icontains=q)
            | Q(tags__name__icontains=q)
            | Q(cuts__name__icontains=q)
            | Q(category__name__icontains=q)
            | Q(subcategory__name__icontains=q)
        ).distinct()
        
        queryset = (
            queryset.select_related("category", "subcategory")
            .prefetch_related(
                Prefetch("cuts", queryset=Cut.objects.all()), "tags", inventory_prefetch
            )
            .order_by("name")[:limit]
        )
        return queryset
    else:
        # Default behavior when no search term is provided
        masalas = base_queryset.filter(category__slug="fishlo-masala")
        
        fishes = base_queryset.exclude(category__slug="fishlo-masala").annotate(
            total_orders=Count("orderitem")
        ).order_by("-total_orders")
        
        # Combine them using union or python lists. Since we need exactly 20, 
        # and union with order_by/annotate can be tricky in Django SQLite,
        # we can evaluate and combine them in Python, or use union if carefully constructed.
        # However, returning a combined QuerySet is required for pagination/serializers.
        # Instead, we can fetch IDs and return a filtered queryset.
        
        masala_ids = list(masalas.values_list('id', flat=True)[:20])
        fish_ids = list(fishes.values_list('id', flat=True)[:20])
        
        combined_ids = []
        f_idx, m_idx = 0, 0
        fish_pattern = [3, 2, 3]
        pattern_idx = 0
        
        while len(combined_ids) < 20 and (f_idx < len(fish_ids) or m_idx < len(masala_ids)):
            # Determine how many fishes to add in this turn
            fish_count_to_add = fish_pattern[pattern_idx % len(fish_pattern)]
            pattern_idx += 1
            
            # Add the fishes
            for _ in range(fish_count_to_add):
                if f_idx < len(fish_ids):
                    combined_ids.append(fish_ids[f_idx])
                    f_idx += 1
            
            # Add 1 masala
            if m_idx < len(masala_ids):
                combined_ids.append(masala_ids[m_idx])
                m_idx += 1
                
        combined_ids = combined_ids[:20]
        
        # We need to preserve the order: masalas first, then fishes

        preserved_order = Case(*[When(pk=pk, then=pos) for pos,pk in enumerate(combined_ids)])
        
        queryset = Product.objects.filter(id__in=combined_ids).order_by(preserved_order)
        
        queryset = (
            queryset.select_related("category", "subcategory")
            .prefetch_related(
                Prefetch("cuts", queryset=Cut.objects.all()), "tags", inventory_prefetch
            )
        )
        return queryset


def get_related_products_queryset(request, slug):
    storage_location = get_user_storage_location(request)

    product = Product.objects.only("id", "category_id", "subcategory_id").get(
        slug=slug, deleted_at__isnull=True
    )

    inventory_prefetch = Prefetch(
        "inventory",
        queryset=(
            Inventory.objects.filter(storagelocation=storage_location)
            if storage_location
            else Inventory.objects.all()
        ),
        to_attr="location_inventory",
    )

    if product.subcategory_id:
        related_products = Product.objects.filter(
            subcategory_id=product.subcategory_id,
            deleted_at__isnull=True,
            is_available=True,
        ).exclude(id=product.id)
    elif product.category_id:
        related_products = Product.objects.filter(
            category_id=product.category_id,
            deleted_at__isnull=True,
            is_available=True,
        ).exclude(id=product.id)
    else:
        related_products = Product.objects.filter(
            deleted_at__isnull=True, is_available=True
        ).exclude(id=product.id)

    related_products = (
        related_products.select_related("category")
        .prefetch_related(inventory_prefetch)
        .only(
            "id",
            "name",
            "slug",
            "featured_image",
            "min_weight",
            "is_available",
            "category_id",
            "category__name",
            "category__slug",
        )
        .order_by("-created_at")
    )

    if storage_location:
        related_products = related_products.filter(
            inventory__storagelocation=storage_location
        ).distinct()

    return related_products
