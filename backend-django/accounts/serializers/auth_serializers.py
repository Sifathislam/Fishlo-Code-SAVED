# accounts/serializers/auth_serializers.py

from phonenumber_field.serializerfields import PhoneNumberField as PhoneNumberSerializerField
from rest_framework import serializers


class SendOTPSerializer(serializers.Serializer):
    phone_number = PhoneNumberSerializerField(region="IN")


class VerifyOTPSerializer(serializers.Serializer):
    session_id = serializers.CharField(max_length=100)  # session id from otp sender service
    otp = serializers.CharField(max_length=6, min_length=6)
