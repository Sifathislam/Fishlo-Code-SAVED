from django.db.models import Avg, Q
from django.utils import timezone
from django.core.cache import cache

from products.models.product_models import Product
from products.models.category_models import Category
from  policies.models.faq_models import FAQ

from orders.utils.number_data_formater import format_weight
from promotions.models.banner_models import Banner


def get_first_banner():
    return Banner.objects.all().first()


def get_home_banners(placement: str):
    now = timezone.now()
    return (
        Banner.objects.filter(placement=placement, is_active=True)
        .filter(
            Q(starts_at__isnull=True) | Q(starts_at__lte=now),
            Q(ends_at__isnull=True) | Q(ends_at__gte=now),
        )
        .order_by("priority", "-starts_at")
    )


def get_most_loved_products(request):
    from products.selectors.product_selectors import get_most_loved_products_queryset
    return get_most_loved_products_queryset(request)


def get_signature_products(request):
    from products.selectors.product_selectors import get_products_list_queryset
    return get_products_list_queryset(request)

def get_shop_by_categories():
    from products.models.category_models import Category
    qs = Category.objects.filter(deleted_at__isnull=True).prefetch_related("subcategories")
    result = list(qs)
    return result


def get_home_faqs():
    from policies.selectors.policy_selectors import get_active_faqs
    result = list(get_active_faqs())
    return result