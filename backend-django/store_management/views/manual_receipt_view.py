from django.shortcuts import render, get_object_or_404, redirect
from django.utils import timezone

from orders.models.orders_models import Order
from accounts.models.company_models import CompanyInfo
from orders.utils.number_data_formater import format_weight
from orders.models.receipt_share_model import ReceiptShareLink


def manual_receipt_view(request, order_number):
    order = get_object_or_404(
        Order.objects.prefetch_related("order_items__selected_cuts"),
        order_number=order_number
    )

    items = []
    total_quantity = 0

    created_at = getattr(order, "created_at", None) or getattr(order, "created", None)
    if created_at:
        dt = timezone.localtime(created_at)
        receipt_date = dt.strftime("%d-%m-%Y")
        receipt_time = dt.strftime("%H:%M:%S")
    else:
        receipt_date = ""
        receipt_time = ""

    for item in order.order_items.all():
        qty = item.quantity or 0
        total_quantity += qty

        # cuts text like thermal receipt
        cut_names = ""
        try:
            if hasattr(item, "selected_cuts") and item.selected_cuts is not None:
                cut_names = ", ".join(
                    item.selected_cuts.values_list("name", flat=True)
                )
        except Exception:
            pass

        if not cut_names:
            cut_names = getattr(item, "custom_note", "") or ""

        # weight label like thermal receipt
        weight_label = ""
        product = getattr(item, "product", None)
        product_weight = getattr(item, "product_weight", None)

        if product_weight is not None and product is not None:
            try:
                weight_label = format_weight(float(product_weight), product, qty)
            except Exception:
                weight_label = str(product_weight)
        elif product_weight is not None:
            weight_label = str(product_weight)
        cut_price = getattr(item, "cut_price", 0) or 0
        items.append({
            "name": item.product_name,
            "quantity": qty,
            "unit_price": item.unit_price,
            "line_total": item.subtotal - cut_price,
            "weight_label": weight_label,
            "cut_type": cut_names,
            "cut_price":cut_price,
        })

    company_info = CompanyInfo.objects.filter(is_active=True).first()

    context = {
        "order": order,
        "items": items,
        "total_quantity": total_quantity,

        "receipt_date": receipt_date,
        "receipt_time": receipt_time,
        "token_number": getattr(order, "token_number", None),
        "bill_number": order.order_number,

        "subtotal": order.subtotal,
        "rounding_off": getattr(order, "adjustable_amount", 0),
        "discount_amount": getattr(order, "discount_amount", 0),
        "delivery_charge": getattr(order, "delivery_charge", 0),
        "net_payable": order.total_amount,

        "store_name": company_info.name if company_info else "Fishlo Technologies",
        "store_address": company_info.get_full_address() if company_info else "",
        "store_phone": company_info.phone if company_info else "",
        "store_email": company_info.email if company_info else "",

        "logo_url": "/logo/fishlo-logo-coral.png",
        "pdf_url": order.manual_receipt_pdf.url if order.manual_receipt_pdf else "#",
    }

    return render(request, "store_management/manual_receipt_view.html", context)



def receipt_short_redirect(request, short_code):
    link = get_object_or_404(
        ReceiptShareLink.objects.select_related("order"),
        short_code=short_code,
        is_active=True,
    )

    link.click_count += 1
    link.last_clicked_at = timezone.now()
    link.save(update_fields=["click_count", "last_clicked_at"])

    return redirect("receipt_short_link", order_number=link.order.order_number)