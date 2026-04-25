# delivery/selectors/assignment_selectors.py
from delivery.models.partner_models import (
    DeliveryPartnerProfile,
    DeliveryAssignmentBatch,
    DeliveryBatchItems,
)


def get_assignment_by_id(assignment_id):
    try:
        return DeliveryAssignmentBatch.objects.select_related(
            "delivery_man", "order"
        ).get(id=assignment_id)
    except DeliveryAssignmentBatch.DoesNotExist:
        return None


def get_assignment_by_order_number(delivery_man, order_number):
    try:
        return DeliveryAssignmentBatch.objects.select_related(
            "delivery_man", "order", "order__order_address"
        ).get(delivery_man=delivery_man, order__order_number=order_number)
    except DeliveryAssignmentBatch.DoesNotExist:
        return None


def get_assignments_for_delivery_man(delivery_man):
    return (
        DeliveryAssignmentBatch.objects.filter(delivery_man=delivery_man)
        .select_related("order")
        .order_by("-assigned_at")
    )


def get_pending_assignments_for_delivery_man(delivery_man):
    return (
        DeliveryAssignmentBatch.objects.filter(
            delivery_man=delivery_man,
            status="assigned",
        )
        .select_related("order")
        .order_by("-assigned_at")
    )


def get_delivery_partner_by_id(partner_id):
    try:
        return DeliveryPartnerProfile.objects.select_related("user", "zone").get(id=partner_id)
    except DeliveryPartnerProfile.DoesNotExist:
        return None


def get_batch_item_by_id(item_id):
    """Single order inside a batch."""
    try:
        return DeliveryBatchItems.objects.select_related(
            "batch", "batch__delivery_man", "order"
        ).get(id=item_id)
    except DeliveryBatchItems.DoesNotExist:
        return None


def get_batch_by_id(item_id):
    """Single order inside a batch."""
    try:
        return DeliveryAssignmentBatch.objects.select_related("delivery_man").get(id=item_id)
    except DeliveryBatchItems.DoesNotExist:
        return None

def get_batches_for_partner(partner):
    """All active batches for a delivery partner."""
    return (
        DeliveryAssignmentBatch.objects
        .filter(delivery_man=partner, status__in=["pending", "accepted", "in_progress"])
        .prefetch_related("assignments__order__order_address")
        .order_by("-assigned_at")
    )


def get_all_batches_for_partner(partner):
    """All batches including completed/cancelled — for history."""
    return (
        DeliveryAssignmentBatch.objects
        .filter(delivery_man=partner)
        .prefetch_related("assignments__order__order_address")
        .order_by("-assigned_at")
    )