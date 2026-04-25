from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from decimal import Decimal

from products.models.product_models import PriceMatrix
from inventory.models.inventory_models import Inventory
from inventory.models.history_models import InventoryHistory


@receiver(pre_save, sender=PriceMatrix)
def cache_old_price_matrix(sender, instance: PriceMatrix, **kwargs):
    """
    Store old values before save so we can detect price changes.
    """
    if not instance.pk:
        instance._old_values = None
        return

    old = PriceMatrix.objects.filter(pk=instance.pk).values(
        "wholesale_price", "regular_price", "display_price", "bargain_price", "min_price"
    ).first()
    instance._old_values = old




def json_safe(value):
    if isinstance(value, Decimal):
        return str(value)   # keeps exact value
    return value


@receiver(post_save, sender=PriceMatrix)
def create_inventory_history_on_price_change(sender, instance: PriceMatrix, created, **kwargs):
    """
    When a price matrix changes, write InventoryHistory for inventories
    that match this product + storage_location.
    """
    old = getattr(instance, "_old_values", None)

    # If this is newly created, you can still log it (optional)
    if created:
        changes = {"price_matrix": {"old": None, "new": "created"}}
    else:
        if not old:
            return

        changes = {}
        fields = ["wholesale_price", "regular_price", "display_price", "bargain_price", "min_price"]
        for f in fields:
            old_val = old.get(f)              # Decimal (or None)
            new_val = getattr(instance, f)    # Decimal
            if old_val != new_val:
                changes[f] = {
                    "old": json_safe(old_val),
                    "new": json_safe(new_val),
                }

        # No actual price changes -> do nothing
        if not changes:
            return

    inventories = Inventory.objects.filter(
        product=instance.product,
        storagelocation=instance.storage_location,
    )

    for inv in inventories:
        InventoryHistory.objects.create(
            inventory=inv,
            product=inv.product,
            storage_location=inv.storagelocation,
            changes=changes,
            # keep stock snapshot too (optional but useful)
            stock_kg_before=inv.stock_kg,
            stock_kg_after=inv.stock_kg,
            stock_pieces_before=inv.stock_pieces,
            stock_pieces_after=inv.stock_pieces,
            wholesale_price=instance.wholesale_price,
            regular_price=instance.regular_price,
            display_price=instance.display_price,
            bargain_price=instance.bargain_price,
            min_price=instance.min_price,
            action_type="PRICE_UPDATE",   
            notes="PriceMatrix updated",
        )
