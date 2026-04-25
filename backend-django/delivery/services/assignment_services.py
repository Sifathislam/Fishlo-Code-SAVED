# delivery/services/assignment_services.py

from django.utils import timezone
from rest_framework import status

from orders.models.orders_models import Order
from delivery.models.partner_models import (
    DeliveryAssignmentBatch,
    DeliveryBatchItems,
    DeliveryLog,
)
from delivery.selectors.assignment_selectors import (
    get_delivery_partner_by_id,
    get_batch_item_by_id,
    get_batch_by_id,
)
from accounts.services.two_factor_service import TwoFactorService
from products.utils import get_user_storage_location

def assign_orders_to_delivery_man(request, order_ids: list, delivery_partner_id: int,
                                   slot_id=None, delivery_date=None):
    """
    Admin assigns multiple orders to a delivery partner.
    Creates one DeliveryAssignmentBatch (envelope) and one DeliveryBatchItems per order.
    """
    if not order_ids:
        return False, "No order IDs provided.", None, status.HTTP_400_BAD_REQUEST

    delivery_partner = get_delivery_partner_by_id(delivery_partner_id)
    if not delivery_partner:
        return False, "Delivery partner not found.", None, status.HTTP_404_NOT_FOUND

    if delivery_partner.status != "Active":
        return False, f"Delivery partner is '{delivery_partner.status}'.", None, status.HTTP_400_BAD_REQUEST

    # Resolve slot
    slot, slot_label = None, ""
    if slot_id:
        from inventory.models.delivery_slot_models import DeliveryTimeSlot
        storagelocation = get_user_storage_location(request)
        slot = DeliveryTimeSlot.objects.filter(id=slot_id , storagelocation=storagelocation).first()
        if slot:
            slot_label = slot.label()
    else:        
        return False, f"Please Select a correct time slot.", None, status.HTTP_400_BAD_REQUEST

    # Create the batch envelope
    batch = DeliveryAssignmentBatch.objects.create(
        delivery_man=delivery_partner,
        delivery_slot=slot,
        slot_label=slot_label,
        delivery_date=delivery_date,
        created_by=request.user,
    )

    results = []
    total_earnings = 0
    for order_id in order_ids:
        try:
            order = Order.objects.get(order_number=order_id)
        except Order.DoesNotExist:
            results.append({"order_id": order_id, "success": False, "message": "Order not found."})
            continue

        # Prevent duplicate active assignment
        already_assigned = DeliveryBatchItems.objects.filter(
            order=order,
            batch__status__in=["pending", "accepted", "in_progress"],
        ).exists()
        if already_assigned:
            results.append({"order_id": order_id, "success": False, "message": "Order already has an active assignment."})
            continue

        attempt_number = DeliveryBatchItems.objects.filter(order=order).count() + 1

        # Create one batch item per order
        item = DeliveryBatchItems.objects.create(
            batch=batch,
            order=order,
            attempt_number=attempt_number,
        )

        DeliveryLog.objects.create(
            batch_item=item,
            event="assigned",
            note=f"Batch {batch.batch_number} — assigned by {request.user}",
        )

        # Set order status to ASSIGNING (request sent to rider)
        order.update_status(
            new_status='ASSIGNING',
            updated_by_user=request.user,
            notes=f"Rider request sent — Batch {batch.batch_number}",
            updated_from='STORE_DASHBOARD'
        )

        total_earnings += order.delivery_charge

        results.append({
            "order_id":    order_id,
            "item_id":     item.id,
            "success":     True,
            "message":     "Assigned successfully.",
        })

    any_success = any(r["success"] for r in results)
    if not any_success:
        batch.delete()
        return False, "No orders could be assigned.", results, status.HTTP_400_BAD_REQUEST

    if total_earnings > 0:
        batch.total_earnings = total_earnings
        batch.save(update_fields=["total_earnings"])

    payload = {"batch_id": batch.id, "batch_number": batch.batch_number, "results": results}
    if all(r["success"] for r in results):
        return True, "All orders assigned successfully.", payload, status.HTTP_201_CREATED
    return True, "Some orders were assigned. See details.", payload, status.HTTP_207_MULTI_STATUS


def accept_batch(request, batch_id: int):
    """
    Delivery partner accepts a batch.
    Orders go from ASSIGNING → ASSIGN, and OUT_FOR_DELIVERY tracking is_current=true.
    """
    try:
        partner = request.user.delivery_partner_profile
    except Exception:
        return False, "No delivery partner profile found.", None, status.HTTP_403_FORBIDDEN

    batch = get_batch_by_id(batch_id)
    if not batch:
        return False, "Assignment not found.", None, status.HTTP_404_NOT_FOUND

    if batch.delivery_man_id != partner.id:
        return False, "This assignment does not belong to you.", None, status.HTTP_403_FORBIDDEN

    batch_items = DeliveryBatchItems.objects.filter(batch=batch)
    for item in batch_items:
        if item.order.status == "ASSIGNING":
            # Set order status to ASSIGN (rider accepted)
            item.order.update_status(
                new_status='ASSIGN',
                updated_by_user=request.user,
                notes=f"Rider accepted — Batch {batch.batch_number}",
                updated_from='DELIVERY_APP'
            )
            # Create OUT_FOR_DELIVERY tracking with is_current=True
            from orders.models.orders_models import OrderTracking
            item.order.tracking_history.filter(is_current=True).update(
                completed=True, is_current=False
            )
            item.order.tracking_history.update_or_create(
                status='OUT_FOR_DELIVERY',
                defaults={
                    "updated_by": request.user,
                    "notes": f"Rider accepted — Batch {batch.batch_number}",
                    "is_current": True,
                    "completed": False,
                }
            )
        # Send the Otp to the ordered users 
            # send_otp = send_delivery_otp(request,item.order)
            # print(send_otp)
        elif item.order.status == "ASSIGN":
            return False, f"Order is already assigned to delivery man: {batch.delivery_man}", None, status.HTTP_400_BAD_REQUEST
        else:
            return False, f"Order is not ready for acceptance (status: {item.order.status}).", None, status.HTTP_400_BAD_REQUEST

    batch.status = 'accepted'
    batch.accepted_at = timezone.now()
    batch.save(update_fields=["accepted_at", "status"])

    DeliveryLog.objects.create(
        event="accepted",
        note=f"Accepted by {partner.first_name} {partner.last_name}",
    )

    return True, "Assignment accepted.", {
        "batch_number": batch.batch_number,
        "accepted_at": batch.accepted_at,
    }, status.HTTP_200_OK


def reject_batch(request, item_id: int, reason: str = ""):
    """
    Delivery partner rejects a batch.
    Orders revert from ASSIGNING → PACKED.
    """
    try:
        partner = request.user.delivery_partner_profile
    except Exception:
        return False, "No delivery partner profile found.", None, status.HTTP_403_FORBIDDEN

    batch = get_batch_by_id(item_id)
    if not batch:
        return False, "Assignment not found.", None, status.HTTP_404_NOT_FOUND

    if batch.delivery_man_id != partner.id:
        return False, "This assignment does not belong to you.", None, status.HTTP_403_FORBIDDEN

    # Revert orders back to PACKED
    batch_items = DeliveryBatchItems.objects.filter(batch=batch)
    for item in batch_items:
        if item.order.status == "ASSIGNING":
            item.order.update_status(
                new_status='PACKED',
                updated_by_user=request.user,
                notes=reason or "Rider rejected assignment",
                updated_from='DELIVERY_APP'
            )

    DeliveryLog.objects.create(
        event="rejected",
        note=reason or "Rejected by delivery partner",
    )

    batch.status = 'cancelled'
    batch.save(update_fields=["status"])

    return True, "Assignment rejected.", None, status.HTTP_200_OK


def send_delivery_otp(request, order):
    result = TwoFactorService.send_otp(order.order_address.phone, 'DELIVERY_OTP')

    if result.get('success'):
        order.otp_session_id = result['session_id']
        order.otp_sent_at = timezone.now()
        order.save(update_fields=['otp_session_id', 'otp_sent_at'])

    return result


def verify_delivery_otp(request, order, otp_code):
    if not order.otp_session_id:
        return {'success': False, 'message': 'No OTP session found. Please request a new OTP.'}

    result = TwoFactorService.verify_otp(order.otp_session_id, otp_code)

    return result