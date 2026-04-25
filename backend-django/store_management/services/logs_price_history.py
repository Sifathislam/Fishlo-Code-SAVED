from ..models.price_history_models import PriceHistory

def log_price_history(*, action, user, price_matrix, product, storage_location, old_obj=None, new_obj=None):
    def val(obj, field):
        return getattr(obj, field) if obj else None

    PriceHistory.objects.create(
        price_matrix=price_matrix,
        product=product,
        storage_location=storage_location,
        action=action,
        user=user,

        old_wholesale_price=val(old_obj, "wholesale_price"),
        old_regular_price=val(old_obj, "regular_price"),
        old_display_price=val(old_obj, "display_price"),
        old_bargain_price=val(old_obj, "bargain_price"),
        old_min_price=val(old_obj, "min_price"),

        new_wholesale_price=val(new_obj, "wholesale_price"),
        new_regular_price=val(new_obj, "regular_price"),
        new_display_price=val(new_obj, "display_price"),
        new_bargain_price=val(new_obj, "bargain_price"),
        new_min_price=val(new_obj, "min_price"),
    )
