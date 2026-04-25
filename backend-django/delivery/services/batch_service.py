from django.utils import timezone
from delivery.models.partner_models import DeliveryBatchItems, DeliveryAssignmentBatch,DeliveryOTP


def update_delivery_batch_status(order,otp=None):
    """
    Update batch status based on order delivery progress.
    """

    batch_item = (
        DeliveryBatchItems.objects
        .select_related("batch", "order")
        .filter(order=order)
        .last()
    )

    if not batch_item:
        return

    batch = batch_item.batch

    batch_items = DeliveryBatchItems.objects.filter(batch=batch).select_related("order")

    total_orders = batch_items.count()

    delivered_orders = batch_items.filter(order__status="DELIVERED").count()

    # If at least one order delivered → batch in progress
    if delivered_orders > 0 and delivered_orders < total_orders:
        if batch.status != "in_progress":
            batch.status = "in_progress"
            batch.save(update_fields=["status"])

    # If all orders delivered → batch completed
    if delivered_orders == total_orders:
        batch.status = "completed"
        batch.completed_at = timezone.now()
        batch.save(update_fields=["status", "completed_at"])
        
    DeliveryOTP.objects.create(batch_item=batch_item,otp=otp,is_verified=True,verified_at=timezone.now())