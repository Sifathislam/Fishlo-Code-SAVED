# store_management/services/receipt_pdf_service.py

from io import BytesIO
from html import escape

from django.core.files.base import ContentFile


def generate_and_save_manual_order_receipt_pdf(*, request, order, receipt_text):
    from weasyprint import HTML
    """
    Generate receipt PDF using WeasyPrint from thermal-style receipt text.
    Returns ContentFile for saving into a FileField.
    """
    safe_receipt_text = escape(receipt_text)

    html_string = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            @page {{
                size: A4;
                margin: 18mm 12mm;
            }}

            body {{
                margin: 0;
                padding: 0;
                background: #ffffff;
                color: #000000;
                font-family: "Courier New", Courier, monospace;
            }}

            .page {{
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: flex-start;
                padding-top: 10px;
            }}

            .receipt {{
                width: 320px;
                padding: 10px 8px;
                box-sizing: border-box;
            }}

            pre {{
                margin: 0;
                white-space: pre-wrap;
                word-wrap: break-word;
                font-size: 14px;
                line-height: 1.35;
                font-family: "Courier New", Courier, monospace;
            }}
        </style>
    </head>
    <body>
        <div class="page">
            <div class="receipt">
                <pre>{safe_receipt_text}</pre>
            </div>
        </div>
    </body>
    </html>
    """

    pdf_buffer = BytesIO()
    HTML(
        string=html_string,
        base_url=request.build_absolute_uri("/")
    ).write_pdf(pdf_buffer)

    pdf_bytes = pdf_buffer.getvalue()
    filename = f"manual_receipts/receipt_{order.order_number}.pdf"

    return ContentFile(pdf_bytes, name=filename)