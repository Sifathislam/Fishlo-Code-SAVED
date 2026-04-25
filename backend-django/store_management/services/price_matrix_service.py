from django.utils import timezone

from products.models.product_models import PriceMatrix
from ..models.price_history_models import PriceHistory
from ..services.logs_price_history import log_price_history
from ..selectors.price_matrix_selectors import active_price_matrix_for_product


def create_price_matrix_with_history(*, user, storage_location, validated_data):
    product = validated_data["product"]

    old_active = active_price_matrix_for_product(storage_location, product)
    if not old_active:
        old_active = PriceMatrix.objects.filter(storage_location=storage_location,product=product).first()

    # snapshot OLD values before modifying
    old_snapshot = None
    if old_active:
        old_snapshot = PriceMatrix(
            wholesale_price=old_active.wholesale_price,
            regular_price=old_active.regular_price,
            display_price=old_active.display_price,
            bargain_price=old_active.bargain_price,
            min_price=old_active.min_price,
        )

        # deactivate old
        old_active.is_active = False
        old_active.valid_to = timezone.now()
        old_active.save(update_fields=["is_active", "valid_to"])

    # create NEW
    new_obj = PriceMatrix.objects.create(
        product=product,
        storage_location=storage_location,
        wholesale_price=validated_data["wholesale_price"],
        regular_price=validated_data["regular_price"],
        display_price=validated_data["display_price"],
        bargain_price=validated_data["bargain_price"],
        min_price=validated_data["min_price"],
        is_active=True,
        valid_from=timezone.now(),
    )

    # log DEACTIVATED with BOTH old + new
    if old_snapshot:
        log_price_history(
            action=PriceHistory.Action.DEACTIVATED,
            user=user,
            price_matrix=old_active,  # ok (reference)
            product=product,
            storage_location=storage_location,
            old_obj=old_snapshot,
            new_obj=new_obj,
        )

    # log CREATED with BOTH old + new
    log_price_history(
        action=PriceHistory.Action.CREATED,
        user=user,
        price_matrix=new_obj,
        product=product,
        storage_location=storage_location,
        old_obj=old_snapshot,
        new_obj=new_obj,
    )

    return new_obj


def update_price_matrix_with_history(*, user, storage_location, instance, serializer):
    """
    Updates an active PriceMatrix instance, logs old/new.
    serializer should already be bound (instance + data) and validated in the view.
    Returns: updated object
    """
    # snapshot old values
    old_snapshot = PriceMatrix(
        wholesale_price=instance.wholesale_price,
        regular_price=instance.regular_price,
        display_price=instance.display_price,
        bargain_price=instance.bargain_price,
        min_price=instance.min_price,
    )

    obj = serializer.save()

    # keep active + ensure valid_from
    if obj.is_active and not obj.valid_from:
        obj.valid_from = timezone.now()
        obj.save(update_fields=["valid_from"])

    log_price_history(
        action=PriceHistory.Action.UPDATED,
        user=user,
        price_matrix=obj,
        product=obj.product,
        storage_location=storage_location,
        old_obj=old_snapshot,
        new_obj=obj,
    )

    return obj
