from django.db.models import Q, F
from inventory.models import Inventory


def get_inventory_queryset(storage_location):
    return (
        Inventory.objects.filter(storagelocation=storage_location)
        .select_related("product", "storagelocation")
        .order_by("-last_updated")
    )

LOW_STOCK_KG = 5
LOW_STOCK_PIECES = 15
def apply_inventory_tab_filter(qs, tab: str):
    """
    tab: all | low_stock | out_of_stock
    """
    tab = (tab or "all").lower()

    # -----------------------
    # OUT OF STOCK
    # -----------------------
    if tab == "out_of_stock":
        return qs.filter(
            Q(product__sell_type="WEIGHT", stock_kg__lte=0)
            | Q(~Q(product__sell_type="WEIGHT"), stock_pieces__lte=0)
        )

    # -----------------------
    # LOW STOCK (FIXED RULE)
    # -----------------------
    if tab == "low_stock":
        return qs.filter(
            (
                Q(product__sell_type="WEIGHT")
                & Q(stock_kg__gt=0)
                & Q(stock_kg__lte=LOW_STOCK_KG)
            )
            |
            (
                ~Q(product__sell_type="WEIGHT")
                & Q(stock_pieces__gt=0)
                & Q(stock_pieces__lte=LOW_STOCK_PIECES)
            )
        )

    return qs
