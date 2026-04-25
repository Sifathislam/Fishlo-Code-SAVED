import razorpay
from decimal import Decimal, InvalidOperation
import requests

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from orders.models import orders_models
from payments.models.payment_models import Payment
from payments.models.refund_models import Refund


# ─────────────────────────────────────────────
# PRIVATE HELPER: Call Razorpay refund API
# ─────────────────────────────────────────────

def _issue_razorpay_refund(payment: Payment, refund_amount: Decimal) -> dict:

    payment_id = payment.gateway_payment_id
    amount_in_paise = int(refund_amount * 100)

    # ── STEP 1: Fetch payment first to see its actual state ──────────────
    fetch_response = requests.get(
        f"https://api.razorpay.com/v1/payments/{payment_id}",
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
    )
    print("=== PAYMENT FETCH ===")
    print("Status code:", fetch_response.status_code)
    print("Payment data:", fetch_response.json())
    # ─────────────────────────────────────────────────────────────────────

    rz_payment = fetch_response.json()
    current_status = rz_payment.get("status")
    razorpay_amount = rz_payment.get("amount")  # in paise

    print(f"Payment status   : {current_status}")
    print(f"Payment amount   : {razorpay_amount} paise  (₹{razorpay_amount/100})")
    print(f"Refund requested : {amount_in_paise} paise  (₹{refund_amount})")
    print(f"Captured?        : {rz_payment.get('captured')}")

    # ── STEP 2: Refund ───────────────────────────────────────────────────
    url = f"https://api.razorpay.com/v1/payments/{payment_id}/refund"
    response = requests.post(
        url,
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
        headers={"Content-Type": "application/json"},
        json={"amount": amount_in_paise},
        timeout=30,
    )

    print("=== REFUND RESPONSE ===")
    print("Status code:", response.status_code)
    print("Response:", response.text)

    if response.status_code == 200:
        return response.json()

    try:
        error_desc = response.json().get("error", {}).get("description", response.text)
    except Exception:
        error_desc = response.text

    raise Exception(f"Razorpay returned {response.status_code}: {error_desc}")


    
# ─────────────────────────────────────────────
# PUBLIC SERVICE FUNCTION
# ─────────────────────────────────────────────
def store_cancel_order_service(
    store_user,        # User object of the store owner / staff performing the action
    payload
):
    """
    Cancel an order and handle the refund (if applicable).

    Args:
        store_user    : User instance — the store owner / staff member cancelling the order
        order_number  : str  — e.g. "ORD-20240501-0001"
        reason        : str  — reason for cancellation
        refund_type   : str  — one of "FULL_REFUND", "PARTIAL_REFUND", "NO_REFUND"
        refund_amount : numeric (optional) — required only for "PARTIAL_REFUND"

    Returns a tuple: (success: bool, message: str, data: dict | None)

    Usage example:
        success, message, data = store_cancel_order_service(
            store_user=request.user,
            order_number="ORD-20240501-0001",
            reason="Item out of stock",
            refund_type="PARTIAL_REFUND",
            refund_amount=150.00,
        )
    """
    order_number = str(payload.get("order_number", "") or "").strip()
    reason = str(payload.get("reason", "") or "").strip()
    refund_type = str(payload.get("refundType", "") or "").strip()
    
    raw_amount = payload.get("refundAmount")
    refund_amount = str(raw_amount).strip() if raw_amount not in (None, "") else None

    
    # ── 1. Validate inputs ───────────────────────────────────────────────
    if not order_number or not str(order_number).strip():
        return False, "order_number is required.", None, 400

    if not reason or not str(reason).strip():
        return False, "reason is required.", None, 400

    refund_type = str(refund_type).strip().upper()
    valid_refund_types = {"FULL_REFUND", "PARTIAL_REFUND", "NO_REFUND"}
    if refund_type not in valid_refund_types:
        return (
            False,
            f"refund_type must be one of: {', '.join(valid_refund_types)}.",
            None,
            400
        )

    # ── 2. Fetch the order ───────────────────────────────────────────────
    try:
        order = orders_models.Order.objects.select_related("user").get(
            order_number=str(order_number).strip()
        )
    except orders_models.Order.DoesNotExist:
        return False, f"Order '{order_number}' not found.", None, 404

    # ── 3. Guard: can't cancel if already cancelled or delivered ─────────
    if order.status in {"CANCELLED", "DELIVERED"}:
        return (
            False,
            f"Order cannot be cancelled. Current status: {order.status}.",
            None,
            400
        )

    # ── 4. Resolve the refund amount ─────────────────────────────────────
    if refund_type == "FULL_REFUND":
        # Always use the full order total — frontend doesn't need to send amount
        resolved_refund_amount = order.total_amount

    elif refund_type == "PARTIAL_REFUND":
        if refund_amount is None:
            return False, "refund_amount is required for PARTIAL_REFUND.", None, 400

        try:
            resolved_refund_amount = Decimal(str(refund_amount))
        except (InvalidOperation, ValueError):
            return False, "Invalid refund_amount value.", None, 400

        if resolved_refund_amount <= 0:
            return False, "refund_amount must be greater than 0.", None, 400

        # Partial amount must NOT exceed the order total
        if resolved_refund_amount > order.total_amount:
            return (
                False,
                f"refund_amount (₹{resolved_refund_amount}) cannot exceed "
                f"order total (₹{order.total_amount}).",
                None,
                400
            )

    else:  # NO_REFUND
        resolved_refund_amount = Decimal("0.00")

    # ── 5. Find successful payment (needed for FULL / PARTIAL refund) ────
    payment = None
    if refund_type in {"FULL_REFUND", "PARTIAL_REFUND"}:
        payment = (
            Payment.objects.filter(order=order, status="SUCCESS")
            .order_by("-created_at")
            .first()
        )

        if not payment:
            return (
                False,
                "No successful payment found for this order. Cannot issue refund.",
                None,
                400
            )

        if not payment.gateway_payment_id:
            return (
                False,
                "Payment gateway ID is missing. Cannot process refund via Razorpay.",
                None,
                400
            )

        # Make sure we aren't refunding more than what's left refundable
        refundable_balance = payment.get_refundable_amount()
        if resolved_refund_amount > refundable_balance:
            return (
                False,
                f"Refund amount (₹{resolved_refund_amount}) exceeds "
                f"refundable balance (₹{refundable_balance}).",
                None,
                400
            )

    # ── 6. DB transaction: cancel order + create Refund + call Razorpay ──
    try:
        with transaction.atomic():

            # 6a. Cancel the order and save
            order.status = "CANCELLED"
            order.cancellation_reason = str(reason).strip()
            order.cancelled_at = timezone.now()
            order.cancelled_by = store_user
            order.save(
                update_fields=[
                    "status",
                    "cancellation_reason",
                    "cancelled_at",
                    "cancelled_by",
                    "updated_at",
                ]
            )

            # 6a-ii. Create CANCELLED tracking entry with timestamp
            orders_models.OrderTracking.objects.filter(order=order).update(is_current=False)
            orders_models.OrderTracking.objects.update_or_create(
                order=order,
                status=orders_models.Order.OrderStatus.CANCELLED,
                defaults={
                    "completed": True,
                    "is_current": True,
                    "timestamp": timezone.now(),
                    "notes": str(reason).strip(),
                    "updated_by": store_user,
                    "updated_from": "STORE_DASHBOARD",
                },
            )

            # 6b. If FULL or PARTIAL refund — create Refund record + call Razorpay
            if refund_type in {"FULL_REFUND", "PARTIAL_REFUND"}:

                # Create Refund row in DB as PROCESSING
                refund_obj = Refund.objects.create(
                    payment=payment,
                    order=order,
                    user=order.user,
                    amount=resolved_refund_amount,
                    refund_type=refund_type,
                    reason=str(reason).strip(),
                    status="PROCESSING",
                    processed_by=store_user,
                )

                # Call Razorpay
                try:
                    rz_refund = _issue_razorpay_refund(payment, resolved_refund_amount)

                    # mark_as_success saves the refund row + updates payment + order payment_status
                    refund_obj.mark_as_success(
                        gateway_refund_id=rz_refund.get("id"),
                        gateway_response=rz_refund,
                    )

                except Exception as rz_err:
                    # Razorpay failed → mark refund FAILED (order stays CANCELLED)
                    refund_obj.mark_as_failed(
                        gateway_response={"error": str(rz_err)}
                    )
                    return (
                        False,
                        f"Order was cancelled but refund failed at gateway: {str(rz_err)}",
                        None,400
                    )

                return (
                    True,
                    "Order cancelled and refund initiated successfully.",
                    {
                        "order_number": order.order_number,
                        "order_status": order.status,
                        "refund_type": refund_type,
                        "refund_amount": str(resolved_refund_amount),
                        "refund_status": refund_obj.status,
                        "gateway_refund_id": refund_obj.gateway_refund_id,
                        "processed_at": refund_obj.processed_at,
                    },200
                )

            else:
                # NO_REFUND — order cancelled, nothing else to do
                return (
                    True,
                    "Order cancelled successfully. No refund applied.",
                    {
                        "order_number": order.order_number,
                        "order_status": order.status,
                        "refund_type": refund_type,
                        "refund_amount": "0.00",
                        "refund_status": "N/A",
                    },
                    200
                )

    except Exception as e:
        return False, f"Something went wrong: {str(e)}", None, 500
