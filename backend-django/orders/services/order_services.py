# orders/services/order_services.py

from decimal import Decimal, ROUND_DOWN

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta

from accounts.models import UserAddress
from payments.models import Payment
from payments.services.payment_service import PaymentService
from payments.services.payment_reconciliation import PaymentReconciliationService
from ..models.cart_models import Cart
from ..models.discount_model import Discount
from ..models.orders_models import Order, OrderAddress, OrderTracking, OrderItem

from ..utils.invoice_generator import generate_order_invoice_pdf
from ..utils.number_data_formater import format_amount
from ..utils.utils import (
    order_creator_util,
    order_billing_util,
    order_item_creator_util,
    order_address_creator_util,
    get_out_of_stock_items
)
from products.utils import get_user_storage_location,get_location_inventory
from inventory.models.delivery_slot_models import DeliveryTimeSlot
from delivery.services.delivery_charge_service import get_delivery_charge_for_distance,get_delivery_distance
from rest_framework.exceptions import ValidationError

def create_order_service(request):
    address_id = request.data.get("address_id")
    notes = request.data.get("notes", "").strip()
    payment_method = request.data.get("payment_method", "").strip()
    discount_code = request.data.get("discount_code", "").strip().upper()
    is_billing_same_as_shipping = (str(request.data.get("is_billing_same_as_shipping", False)).lower() == "true")
    delivery_day = (request.data.get("delivery_day") or "").strip().upper()
    delivery_slot_id = request.data.get("delivery_slot_id")

    if delivery_day not in ["TODAY", "TOMORROW"]:
        return False, "Please select delivery day: Today or Tomorrow.", None, None, 400

    if not delivery_slot_id:
        return False, "Please select a delivery time slot.", None, None, 400

    if not address_id:
        return False, "Address is required", None, None, 400

    if payment_method not in ["Razorpay", "UPI_ON_DELIVERY", "COD"]:
        return False, "Invalid payment method", None, None, 400
    if address_id:
        user_storage_location = get_user_storage_location(request, address_id)
    else:
        user_storage_location = get_user_storage_location(request)
        
    user_address = get_object_or_404(UserAddress, id=address_id, user=request.user)

    if not is_billing_same_as_shipping:
        required_billing_fields = [
            "full_name",
            "phone_number",
            "email",
            "house_details",
            "city",
            "state",
            "postal_code",
        ]
        missing_fields = [
            field for field in required_billing_fields if not request.data.get(field)
        ]

        if missing_fields:
            return (
                False,
                f"Please add data for these fields: {', '.join(missing_fields)}",
                None,
                None,
                400,
            )

        billing_address = order_billing_util(
            request.data.get("full_name"),
            request.data.get("phone_number"),
            request.data.get("email"),
            request.data.get("house_details"),
            request.data.get("city"),
            request.data.get("state"),
            request.data.get("postal_code"),
        )
    else:
        billing_address = order_billing_util(
            user_address.recipient_name,
            user_address.recipient_phone,
            user_address.user.email if user_address.user.email else "",
            user_address.house_details,
            user_address.city,
            user_address.state,
            user_address.postal_code,
        )

    cart = (
        Cart.objects.filter(user=request.user, is_active=True)
        .prefetch_related("items__product", "items__selected_cuts")
        .first()
    )

    if not cart or cart.items.count() == 0:
        return False, "Cart is empty", None, None, 400

    cart_items = list(cart.items.all())

    delivery_charge = Decimal(0)

    discount_amount = Decimal("0")
    discount_percentage = 0
    discount_fixed_amount = 0
    validated_discount_code = ""
    discount_obj = None
    subtotal = cart.get_subtotal()

    # Check storage location minimum order amount
    if user_storage_location and payment_method != "COD" and subtotal < user_storage_location.minimum_order_amount:
        return (
            False,
            f"Your order must be at least ₹{format_amount(user_storage_location.minimum_order_amount)}, not including delivery charges. Please add more items to your cart.",
            None,
            None,
            400,
        )
    if discount_code:
        try:
            discount_obj = Discount.objects.get(code=discount_code)
            is_valid, message = discount_obj.is_valid(request)

            if not is_valid:
                return False, message, None,None, 400
            # Check discount minimum order amount
            if discount_obj.min_order_amount and subtotal < discount_obj.min_order_amount:
                return (
                    False,
                    f"You need to order at least ₹{discount_obj.min_order_amount} to use this discount.",
                    None,
                    None,
                    400,
                )

            discount_amount = discount_obj.calculate_discount(subtotal)
            validated_discount_code = discount_obj.code

            if discount_obj.discount_type == "PERCENTAGE":
                discount_percentage = int(discount_obj.discount_percentage)
            if discount_obj.discount_type == "FIXED_AMOUNT":
                discount_fixed_amount = discount_obj.discount_fixed_amount

        except Discount.DoesNotExist:
            return False, "Invalid discount code", None, None, 404

    partial_payment_amount = Decimal("0.00")

    try:
        with transaction.atomic():
            order = order_creator_util(
                request,
                delivery_charge,
                validated_discount_code,
                discount_amount,
                discount_percentage,
                discount_fixed_amount,
                partial_payment_amount,
                notes,
                payment_method,
                storage_location=user_storage_location,
            )
            out_of_stock_items = get_out_of_stock_items(cart_items, user_storage_location)

            if out_of_stock_items:
                names_str = ", ".join(out_of_stock_items)

                return (
                    False,
                    f"{names_str} — products are out of stock. Please check.",
                    {"out_of_stock_products": out_of_stock_items},
                    None,
                    400,
                )
            order_items = order_item_creator_util(order, cart_items)
            created_items = OrderItem.objects.bulk_create(order_items)

            for idx, cart_item in enumerate(cart_items):
                if cart_item.selected_cuts.exists():
                    created_items[idx].selected_cuts.set(cart_item.selected_cuts.all())

            order_address_creator_util(user_address,order,request,billing_address,is_billing_same_as_shipping,)
            slot = DeliveryTimeSlot.objects.filter(id=delivery_slot_id,storagelocation=user_storage_location,is_active=True).first()
            
            if not slot:
                return False, "Selected delivery slot is not available.", None, None, 400

            # Validate slot against store open/close (you already have open/close in StorageLocation)
            store = slot.storagelocation
            if store.opening_time and slot.start_time < store.opening_time:
                return False, "Selected slot is outside store opening time.", None, None, 400
            if store.closing_time and slot.end_time > store.closing_time:
                return False, "Selected slot is outside store closing time.", None, None, 400

            # If TODAY, disable past/too-late slots
            if delivery_day == "TODAY":
                now = timezone.localtime()
                cutoff_minutes = int(slot.cutoff_minutes or 0)

                # block already passed slots
                if slot.end_time and slot.end_time <= now.time():
                    return False, "This time slot has already passed. Please select another slot.", None, None, 400

                # “too late” means we are too close to slot start
                if cutoff_minutes:
                    cutoff_time = (now + timedelta(minutes=cutoff_minutes)).time()
                    if slot.start_time and slot.start_time <= cutoff_time:
                        return False, "It’s too late to select this slot. Please choose the next slot.", None, None, 400
            # 4) Set order slot + snapshot (NO ERROR way)
            order.set_delivery_slot(slot, delivery_day)
            if discount_code == "FISHLO":
                order.delivery_charge = 0
                order.save(update_fields=["delivery_charge"])
            else:
                delivery_distance = get_delivery_distance(address_id,user_storage_location)
                delivery_charge = get_delivery_charge_for_distance(storagelocation=user_storage_location,distance_km=delivery_distance,return_model=True)
                order.set_delivery_charge(delivery_charge)
            order.calculate_totals()
            
            if payment_method == "COD":
                if user_storage_location:
                    min_cod = user_storage_location.min_cod_amount
                    max_cod = user_storage_location.max_cod_amount
                else:
                    min_cod = Decimal("299.00")
                    max_cod = Decimal("1999.00")

                if order.total_amount < min_cod:
                    return False, f"Minimum order ₹{format_amount(min_cod)} for Cash On Delivery", None, None, 400
                if order.total_amount > max_cod:
                    return False, f"Cash On Delivery is available for orders up to ₹{format_amount(max_cod)}", None, None, 400

            
            if payment_method == "UPI_ON_DELIVERY" and user_storage_location:
                if user_storage_location.partial_pay_pre_order_percentage > 0 and order.total_amount >= user_storage_location.minimum_pre_order_amount:
                    partial_payment_amount = (order.total_amount * user_storage_location.partial_pay_pre_order_percentage) / Decimal("100")
                    partial_payment_amount = partial_payment_amount.quantize(Decimal("1"), rounding=ROUND_DOWN)
            
            order.partial_pay = partial_payment_amount
            order.save(update_fields=["partial_pay"])

            if discount_amount >= order.subtotal:
                order.payment_status = "PAID"
                order.status = "PENDING"
                order.remaining_amount = Decimal("0.00")
                order.save(
                    update_fields=[
                        "payment_status",
                        "status",
                        "remaining_amount",
                    ]
                )

                payment = Payment.objects.create(
                    order=order,
                    user=request.user,
                    payment_method=(
                        "RAZORPAY" if payment_method == "Razorpay" else "UPI_ON_DELIVERY"
                    ),
                    amount=Decimal("0.00"),
                    status="SUCCESS",
                )

                OrderTracking.objects.update_or_create(
                    order=order,
                    status=Order.OrderStatus.PENDING,
                    defaults={
                        "completed": True,
                        "is_current": False,
                        "timestamp": timezone.now(),
                        "updated_from": "SYSTEM",
                    },
                )
                OrderTracking.objects.update_or_create(
                    order=order,
                    status=Order.OrderStatus.CONFIRMED,
                    defaults={
                        "completed": False,
                        "is_current": True,
                        "timestamp": None,
                        "updated_from": "SYSTEM",
                    },
                )



                if discount_code and validated_discount_code:
                    from django.db.models import F
                    Discount.objects.filter(pk=discount_obj.pk).update(used_count=F("used_count") + 1)

                request.user.profile.increment_order_stats(order.total_amount)

                Cart.objects.filter(user=request.user, is_active=True).delete()

                return (
                    True,
                    "Order created successfully",
                    {
                        "order_id": order.id,
                        "order_number": order.order_number,
                        "payment_id": payment.id,
                        "total_amount": format_amount(order.total_amount),
                        "subtotal": format_amount(order.subtotal),
                        "vat_amount": format_amount(order.vat_amount),
                        "delivery_charge": format_amount(order.delivery_charge),
                        "discount_amount": format_amount(order.discount_amount),
                        "discount_code": order.discount_code if order.discount_code else None,
                        "payment_method": payment_method,
                        "partial_pay": format_amount(order.partial_pay),
                        "remaining_amount": format_amount(order.remaining_amount),
                        "amount_to_pay_now": 0.0,
                        "payment_status": "PAID",
                    },
                    None,
                    201,
                )

            if payment_method == "UPI_ON_DELIVERY":
                order.remaining_amount = order.total_amount - partial_payment_amount
                order.save(update_fields=["remaining_amount"])

            payment_amount = (
                partial_payment_amount
                if payment_method == "UPI_ON_DELIVERY"
                else order.total_amount
            )

            payment = Payment.objects.create(
                order=order,
                user=request.user,
                payment_method=("RAZORPAY" if payment_method == "Razorpay" else "UPI_ON_DELIVERY"),
                amount=payment_amount,
                status="PENDING",
            )

            if discount_code and validated_discount_code:
                from django.db.models import F
                Discount.objects.filter(pk=discount_obj.pk).update(used_count=F("used_count") + 1)

            if order.total_amount > 460000:
                return (
                    False,
                    f"Please place an order below 460000. Your current amount is {order.total_amount}.",
                    {
                        "order_id": order.id,
                        "order_number": order.order_number,
                        "payment_id": payment.id,
                    },
                    None,
                    400,
                )

        if payment_method == "COD":
            payment = Payment.objects.create(
                order=order,
                user=request.user,
                payment_method="COD",
                amount=order.total_amount,
                status="PENDING",
            )

            order.payment_status = "PENDING"
            order.status = "PENDING"
            order.partial_pay = Decimal("0.00")
            order.remaining_amount = order.total_amount
            order.save(update_fields=["payment_status", "status", "partial_pay", "remaining_amount"])

            OrderTracking.objects.update_or_create(
                order=order,
                status=Order.OrderStatus.PENDING,
                defaults={
                    "completed": True,
                    "is_current": False,
                    "timestamp": timezone.now(),
                    "updated_from": "SYSTEM",
                },
            )
            OrderTracking.objects.update_or_create(
                order=order,
                status=Order.OrderStatus.CONFIRMED,
                defaults={
                    "completed": False,
                    "is_current": True,
                    "timestamp": None,
                    "updated_from": "SYSTEM",
                },
            )

            from orders.selectors.cart_selectors import get_inventory
            orderItems = order.order_items.all()
            for item in orderItems:
                product_inventory = get_inventory(request, item.product) 
                if item.product.sell_type == 'WEIGHT':
                    # item_order_total_weight = Decimal(item.weight) 
                    # product_inventory.stock_kg -= item_order_total_weight

                    # Weight stock is intentionally NOT deducted at payment time.
                    # It is deducted later when the store staff enters the actual
                    # measured weight during the PROCESSING status change.
                    pass
                else:
                    product_inventory.stock_pieces -= Decimal(item.quantity)
                product_inventory.save(skip_history=True)

            if discount_code and validated_discount_code:
                from django.db.models import F
                Discount.objects.filter(pk=discount_obj.pk).update(used_count=F("used_count") + 1)

            request.user.profile.increment_order_stats(order.total_amount)
            
            from orders.utils.email_service import notify_admin_new_order
            try:
                notify_admin_new_order(order)
            except Exception:
                pass

            Cart.objects.filter(user=request.user, is_active=True).delete()

            return (
                True,
                "Order created successfully",
                {
                    "order_id": order.id,
                    "order_number": order.order_number,
                    "payment_id": payment.id,
                    "total_amount": format_amount(order.total_amount),
                    "subtotal": format_amount(order.subtotal),
                    "vat_amount": format_amount(order.vat_amount),
                    "delivery_charge": format_amount(order.delivery_charge),
                    "discount_amount": format_amount(order.discount_amount),
                    "discount_code": order.discount_code if order.discount_code else None,
                    "payment_method": payment_method,
                    "partial_pay": format_amount(order.partial_pay),
                    "remaining_amount": format_amount(order.remaining_amount),
                    "amount_to_pay_now": 0.0,
                    "payment_status": "PENDING",
                },
                None,
                201,
            )

        try:
            payment_service = PaymentService()
            razorpay_order = payment_service.create_payment_order(
                order,
                currency="INR",
                amount=payment_amount,
            )

            payment.gateway_order_id = razorpay_order.get("gateway_order_id")
            payment.gateway_response = razorpay_order
            payment.save(update_fields=["gateway_order_id", "gateway_response"])

            return (
                True,
                "Order created successfully",
                {
                    "order_id": order.id,
                    "order_number": order.order_number,
                    "payment_id": payment.id,
                    "total_amount": format_amount(order.total_amount),
                    "subtotal": format_amount(order.subtotal),
                    "vat_amount": format_amount(order.vat_amount),
                    "delivery_charge": format_amount(order.delivery_charge),
                    "discount_amount": format_amount(order.discount_amount),
                    "discount_code": order.discount_code if order.discount_code else None,
                    "payment_method": payment_method,
                    "partial_pay": format_amount(order.partial_pay),
                    "remaining_amount": format_amount(order.remaining_amount),
                    "amount_to_pay_now": format_amount(payment_amount),
                },
                razorpay_order,
                201,
            )

        except Exception as payment_error:
            payment.mark_as_failed(
                reason=f"Payment gateway error: {str(payment_error)}",
                gateway_response={"error": str(payment_error)},
            )

            order.status = "CANCELLED"
            order.payment_status = "FAILED"
            order.save(update_fields=["status", "payment_status"])

            if discount_code and validated_discount_code:
                from django.db.models import F
                Discount.objects.filter(pk=discount_obj.pk).update(used_count=F("used_count") - 1)

            return (
                False,
                f"Payment gateway error: {str(payment_error)}",
                {
                    "order_id": order.id,
                    "order_number": order.order_number,
                    "payment_id": payment.id,
                },
                None,
                400,
            )

    except Exception as e:
        print(e)
        return False, f"Order creation failed: {str(e)}", None, None, 500


def reconcile_user_orders_service(user):
    reconciliation = PaymentReconciliationService()
    results = reconciliation.reconcile_user_orders(user)
    return results


def download_invoice_payload_service(request, *, order_number):
    order = get_object_or_404(Order, order_number=order_number)

    if order.user != request.user and not request.user.is_staff:
        return False, {"error": "You don't have permission to access this invoice"}, None, 403

    if not order.payment_status == "PAID":
        return (
            True,
            {
                "pdf_available": False,
                "pdf_link": None,
                "message": "Invoice is only available for paid orders",
            },
            None,
            200,
        )

    try:
        if not order.invoice_pdf:
            generate_order_invoice_pdf(request, order)

        pdf_url = request.build_absolute_uri(order.invoice_pdf.url)

        return (
            True,
            {
                "pdf_available": True,
                "pdf_link": pdf_url,
                "message": "Invoice generated successfully",
            },
            None,
            200,
        )

    except Exception as e:
        print(e)
        return (
            False,
            {
                "pdf_available": False,
                "pdf_link": None,
                "error": f"Failed to generate invoice: {str(e)}",
            },
            None,
            500,
        )


def preview_invoice_response_service(request, *, order_number, http_response_class):
    order = get_object_or_404(Order, order_number=order_number)

    if order.user != request.user:
        return False, {"error": "You don't have permission to access this invoice"}, None, 403

    if order.invoice_pdf:
        response = http_response_class(order.invoice_pdf.read(), content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="invoice_{order.order_number}.pdf"'
        return True, None, response, 200

    try:
        pdf_file = generate_order_invoice_pdf(request, order)
        response = http_response_class(pdf_file.read(), content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="invoice_{order.order_number}.pdf"'
        return True, None, response, 200
    except Exception as e:
        return False, {"error": f"Failed to generate invoice: {str(e)}"}, None, 500


def cancel_order_service(request):
    order_number = request.data.get("order_number", "").strip()

    if not order_number:
        return False, "Order number is required", None, 400

    order = get_object_or_404(Order, order_number=order_number, user=request.user)

    if order.status == "CANCELLED":
        return False, "Order is already cancelled", None, 400

    if order.status == "DELIVERED":
        return False, "Cannot cancel delivered order", None, 400

    if order.payment_status in ["PAID", "PARTIALLY_PAID"]:
        return False, "Cannot cancel a paid order", None, 400
    
    try:
        order.status = "CANCELLED"
        order.payment_status = "FAILED"
        order.save(update_fields=["status", "payment_status"])

        OrderTracking.objects.update_or_create(
            order=order,
            status=Order.OrderStatus.CANCELLED,
            defaults={
                "completed": False, 
                "is_current": False,
                "timestamp": timezone.now(),
                "updated_from": "CUSTOMER",
            },
        )

        OrderTracking.objects.filter(order=order).update(is_current=False)

        order.payments.filter(status="PENDING").update(status="FAILED")

        response_data = {
            "order_number": order.order_number,
            "status": order.status,
            "payment_status": order.payment_status,
        }

        return True, "Order cancelled successfully", response_data, 200

    except Exception as e:
        return False, f"Failed to cancel order: {str(e)}", None, 500
