# sms_service.py
import requests
from django.conf import settings



def send_receipt_sms(phone, short_url, order=None):
    """
    Send receipt SMS through 2Factor Bulk API.
    Returns: (success: bool, data: dict|str)
    """
    if not phone:
        return False, "Phone number is missing"

    # Ensure international format
    phone = str(phone).strip()
    if not phone.startswith("+"):
        phone = f"+91{phone}"   # change country code if needed

    message_text = f"Thank you for your order. View your receipt: {short_url}"

    url = "https://2factor.in/API/R1/Bulk/"
    payload = {
        "module": "TRANS_SMS",
        "apikey": settings.TWOFACTOR_API_KEY,
        "messages": [
            {
                "smsFrom":'FISHLO',   # example: TFACTR
                "smsTo": phone,
                "smsText": message_text,
                "callback_value1": f"order_{order.id}" if order else "",
                "callback_value2": str(getattr(order, "order_number", "")),
                "callback_format": "json",
            }
        ],
    }

    headers = {
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        response.raise_for_status()

        data = response.json()

        if data.get("success") is True:
            return True, data

        print("2Factor SMS failed response:", data)
        return False, data

    except requests.RequestException as exc:
        print("Receipt SMS send failed for phone=", phone)
        return False, str(exc)