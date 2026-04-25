from django.db.models import Prefetch

from ..models import Category, SubCategory


def get_category_list_queryset():
    active_subcategories = SubCategory.objects.filter(deleted_at__isnull=True)

    categories = (
        Category.objects.filter(deleted_at__isnull=True)
        .prefetch_related(Prefetch("subcategories", queryset=active_subcategories))
        .order_by("name")
    )
    return categories
