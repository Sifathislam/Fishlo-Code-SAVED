# Packages Import
import requests
from django.conf import settings


# -----------------
# OTP Verification Function
# -----------------
class TwoFactorService:
    BASE_URL = "https://2factor.in/API/V1"
    API_KEY = settings.TWOFACTOR_API_KEY

    @classmethod
    def send_otp(cls, phone_number, template_name="Fishlo+Authentication+OTP"):

        phone = str(phone_number).replace("+91", "").replace("+", "")

        url = f"{cls.BASE_URL}/{cls.API_KEY}/SMS/{phone}/AUTOGEN/{template_name}"

        try:
            response = requests.get(url, timeout=30)
            data = response.json()

            if response.status_code == 200 and data.get("Status") == "Success":
                return {
                    "success": True,
                    "session_id": data.get("Details"),
                    "message": "A verification code has been sent to your phone.",
                }
            else:
                error_msg = data.get(
                    "Details", "We couldn’t send the verification code."
                )
                return {
                    "success": False,
                    "session_id": None,
                    "message": "We couldn’t send the verification code. Please try again shortly.",
                }
        except requests.exceptions.RequestException as e:
            print(e)
            return {
                "success": False,
                "session_id": None,
                "message": "We’re having trouble connecting to the OTP service. Please try again shortly.",
            }

    @classmethod
    def verify_otp(cls, session_id, otp_code):

        url = f"{cls.BASE_URL}/{cls.API_KEY}/SMS/VERIFY/{session_id}/{otp_code}"

        
        try:
            response = requests.get(url, timeout=10)
            data = response.json()

            # if response.status_code == 200 and data.get('Status') == 'Success':
            if response.status_code == 200 and data.get("Status") == "Success":
                return {
                    "success": True,
                    "message": "Your code has been verified successfully.",
                }
            else:
                error_msg = data.get("Details", "Invalid OTP")
                return {
                    "success": False,
                    "message": "The code you entered isn’t correct. Please try again.",
                }
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "message": "Something went wrong while verifying your OTP. Please try again shortly.",
            }
