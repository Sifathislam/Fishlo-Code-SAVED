# accounts/serializers/address_serializers.py

import re
from decimal import InvalidOperation

from django.utils.html import escape
from rest_framework import serializers

from ..models import UserAddress


class UserAddressSerializer(serializers.ModelSerializer):
    full_address = serializers.CharField(source="get_full_address", read_only=True)
    address_type_other = serializers.CharField(
        max_length=50, required=False, allow_blank=True, allow_null=True
    )

    class Meta:
        model = UserAddress
        fields = [
            "id",
            "address_type",
            "address_type_other",
            "recipient_name",
            "recipient_phone",
            "house_details",
            "address_line_2",
            "landmark",
            "city",
            "state",
            "country",
            "postal_code",
            "latitude",
            "longitude",
            "is_default",
            "is_active",
            "full_address",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "id"]

    def sanitize_text(self, value, field_name="field"):
        if value is None or value == "":
            return value

        value = str(value).strip()
        if not value:
            return ""

        allowed_special = r"[a-zA-Z0-9\s\-\.,#/()&\+]"
        if not re.match(f"^{allowed_special}+$", value):
            raise serializers.ValidationError(
                f"{field_name} contains invalid special characters. . Only letters, numbers, spaces, and common punctuation (-, ., ,, #, /, (, ), &) are allowed."
            )

        if re.search(r"[^a-zA-Z0-9]{3,}", value):
            raise serializers.ValidationError(
                f"{field_name} contains too many consecutive special characters."
            )

        return value

    def sanitize_name(self, value, field_name="name"):
        if value is None or value == "":
            return value

        value = str(value).strip()
        if not value:
            return ""

        if not re.match(r"^[a-zA-Z\s\-\'.]+$", value):
            raise serializers.ValidationError(
                f"{field_name} should only contain letters, spaces, hyphens, apostrophes, and periods."
            )

        return value

    def validate_house_details(self, value):
        if value is None or value == "":
            raise serializers.ValidationError("House details cannot be null or empty.")

        value = self.sanitize_text(value, "House details")

        if not value or not value.strip():
            raise serializers.ValidationError("House details cannot be empty or whitespace only.")

        if len(value) > 255:
            raise serializers.ValidationError("House details must be 255 characters or less.")

        return value

    def validate_state(self, value):
        if value is None or value == "":
            raise serializers.ValidationError("State cannot be null or empty.")

        value = self.sanitize_text(value, "State")

        if not value or not value.strip():
            raise serializers.ValidationError("State cannot be empty or whitespace only.")

        if len(value) > 100:
            raise serializers.ValidationError("State must be 100 characters or less.")

        return value

    def validate_address_line_2(self, value):
        if value is None or value == "":
            return value

        value = self.sanitize_text(value, "Address line 2")

        if value and len(value) > 255:
            raise serializers.ValidationError("Address line 2 must be 255 characters or less.")

        return value

    def validate_recipient_name(self, value):
        if value is None or value == "":
            return value

        value = self.sanitize_name(value, "Recipient name")

        if value and len(value) > 200:
            raise serializers.ValidationError("Recipient name must be 200 characters or less.")

        return value

    def validate_recipient_phone(self, value):
        if value is None or value == "":
            return value

        value = str(value).strip()
        if not value:
            return ""

        if len(value) > 20:
            raise serializers.ValidationError("Recipient phone must be 20 characters or less.")

        if not re.match(r"^[\d\s\+\-\(\)]+$", value):
            raise serializers.ValidationError(
                "Phone number can only contain digits, spaces, '+', '-', and parentheses."
            )

        return value

    def validate_city(self, value):
        if value is None or value == "":
            return value

        value = self.sanitize_text(value, "City")

        if value and len(value) > 100:
            raise serializers.ValidationError("City must be 100 characters or less.")

        return value

    def validate_country(self, value):
        if value is None or value == "":
            return "India"

        value = self.sanitize_text(value, "Country")

        if value and len(value) > 100:
            raise serializers.ValidationError("Country must be 100 characters or less.")

        return value or "India"

    def validate_postal_code(self, value):
        if value is None or value == "":
            return value

        value = str(value).strip()
        if not value:
            return ""

        if len(value) > 20:
            raise serializers.ValidationError("Postal code must be 20 characters or less.")

        if not value.isdigit():
            raise serializers.ValidationError("Postal code must contain only digits.")

        if not (4 <= len(value) <= 10):
            raise serializers.ValidationError("Postal code must be between 4-10 digits.")

        return value

    def validate_address_type_other(self, value):
        if value is None or value == "":
            return value

        value = self.sanitize_text(value, "Address type")

        if value and len(value) > 50:
            raise serializers.ValidationError("Address type other must be 50 characters or less.")

        return value

    def validate_latitude(self, value):
        if value is None or value == "":
            return value

        try:
            lat = float(value)
            if not (-90 <= lat <= 90):
                raise serializers.ValidationError("Latitude must be between -90 and 90.")
            return value
        except (ValueError, TypeError, InvalidOperation):
            raise serializers.ValidationError("Invalid latitude value.")

    def validate_longitude(self, value):
        if value is None or value == "":
            return value

        try:
            lon = float(value)
            if not (-180 <= lon <= 180):
                raise serializers.ValidationError("Longitude must be between -180 and 180.")
            return value
        except (ValueError, TypeError, InvalidOperation):
            raise serializers.ValidationError("Invalid longitude value.")

    def validate(self, data):
        address_type = data.get("address_type")
        address_type_other = data.get("address_type_other")

        if address_type == "other" and not address_type_other:
            raise serializers.ValidationError(
                {"address_type_other": 'Please specify the address type when selecting "Other".'}
            )

        latitude = data.get("latitude")
        longitude = data.get("longitude")

        if (latitude is not None and longitude is None) or (longitude is not None and latitude is None):
            raise serializers.ValidationError(
                {"location": "Both latitude and longitude must be provided together."}
            )

        return data

    def to_representation(self, instance):
        data = super().to_representation(instance)

        text_fields = [
            "recipient_name",
            "house_details",
            "address_line_2",
            "city",
            "state",
            "country",
            "address_type_other",
        ]
        for field in text_fields:
            if data.get(field):
                data[field] = escape(str(data[field]))

        if data.get("latitude"):
            data["latitude"] = f"{float(data['latitude']):.6f}"
        if data.get("longitude"):
            data["longitude"] = f"{float(data['longitude']):.6f}"

        return data
