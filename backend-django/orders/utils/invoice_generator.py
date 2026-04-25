from io import BytesIO

from django.conf import settings
from django.core.files.base import ContentFile
from django.template.loader import render_to_string
from django.utils import timezone

from accounts.models import CompanyInfo
from products.utils import get_user_storage_location

def generate_order_invoice_pdf(request, order):
    from weasyprint import HTML

    if order.invoice_pdf:
        return order.invoice_pdf.open()

    company = CompanyInfo.objects.filter(is_active=True).first()
    if not company:
        raise ValueError("No active company info found")

    company_image = request.build_absolute_uri(company.logo.url) if company.logo else ""
    storage = get_user_storage_location(request)
    html_string = render_to_string(
        "orders/invoice.html",
        {"order": order, "company": company, "company_image": company_image, "storage":storage},
    )

    pdf_buffer = BytesIO()
    HTML(string=html_string, base_url=request.build_absolute_uri("/")).write_pdf(
        pdf_buffer
    )

    pdf_bytes = pdf_buffer.getvalue()

    generate_and_save_order_invoice(pdf_bytes, order)

    return BytesIO(pdf_bytes)


def generate_and_save_order_invoice(pdf_bytes, order):
    """
    Save generated invoice PDF to order model
    """
    filename = f"invoice_{order.order_number}.pdf"

    order.invoice_pdf.save(filename, ContentFile(pdf_bytes), save=False)

    order.invoice_generated_at = timezone.now()
    order.save(update_fields=["invoice_pdf", "invoice_generated_at"])

    return order
