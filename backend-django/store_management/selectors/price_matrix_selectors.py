from products.models.product_models import PriceMatrix
from django.db.models import Exists, OuterRef
from inventory.models.inventory_models import Inventory


def active_price_matrix_qs(storage_location):
    inv_exists = Inventory.objects.filter(
        storagelocation=storage_location,
        product_id=OuterRef("product_id"),
    )

    return (
        PriceMatrix.objects
        .select_related("product", "storage_location")
        .filter(storage_location=storage_location, is_active=True)
        .annotate(in_inventory=Exists(inv_exists))
        .filter(in_inventory=True)
        .order_by("product__name")
    )


def active_price_matrix_for_product(storage_location, product):
    """
    Get current active PriceMatrix for a product+location (if any)
    """
    return (
        PriceMatrix.objects
        .filter(product=product, storage_location=storage_location, is_active=True)
        .first()
    )
