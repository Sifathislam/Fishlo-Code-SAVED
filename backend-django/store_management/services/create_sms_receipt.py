from orders.utils.send_sms_with_recipt_on_manual_order import send_receipt_sms
from .receipt_pdf_service import generate_and_save_manual_order_receipt_pdf
from orders.models.receipt_share_model import ReceiptShareLink

def create_manual_order_receipt_link_and_sms(*, request, order, receipt_text):
    customer_phone = getattr(order, "customer_phone", None)

    if not customer_phone:
        print("No customer phone found for order =", order.order_number)
        return None

    # Generate receipt PDF
    receipt_file = generate_and_save_manual_order_receipt_pdf(
        request=request,
        order=order,
        receipt_text=receipt_text,
    )

    # Save receipt PDF in your separate manual field
    order.manual_receipt_pdf.save(receipt_file.name, receipt_file, save=False)
    order.save(update_fields=["manual_receipt_pdf"])

    # Create short share link
    link = ReceiptShareLink.objects.create(
        order=order,
        short_code=ReceiptShareLink.generate_code(6),
        phone=customer_phone,
        is_active=True,
    )

   
    short_url = f"https://fishlo.in/r/{link.short_code}/"
    print("short url ==>", short_url)

    success, sms_response = send_receipt_sms(
        phone=customer_phone,
        short_url=short_url,
        order=order,
    )

    print(success)
    print(sms_response)

    return link