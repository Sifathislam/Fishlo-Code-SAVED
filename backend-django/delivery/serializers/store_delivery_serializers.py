from rest_framework import serializers
from delivery.models.partner_models import DeliveryPartnerProfile

class StoreDeliveryPartnerListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    wallet_balance = serializers.SerializerMethodField()
    total_earned = serializers.SerializerMethodField()
    today_deliveries = serializers.SerializerMethodField()
    zone_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryPartnerProfile
        fields = [
            "id",
            "employee_id",
            "full_name",
            "first_name",
            "last_name",
            "email",
            "phone",
            "role",  # We'll map this virtually to "Delivery Boy"
            "status",
            "is_active_duty",
            "dob",
            "gender",
            "blood_group",
            "emergency_contact",
            "address",
            "vehicle_type",
            "vehicle_number",
            "license_number",
            "vehicle_insurance_expiry",
            "joining_date",
            "zone_name",
            "wallet_balance",
            "total_earned",
            "today_deliveries",
            "bank_account_number",
            "ifsc_code",
            "bank_name",
            "upi_id",
            "profile_image",
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_role(self, obj):
        return "Delivery"

    def get_phone(self, obj):
        return str(obj.user.phone_number) if hasattr(obj, "user") and hasattr(obj.user, "phone_number") else None

    def get_email(self, obj):
        return obj.user.email if hasattr(obj, "user") and hasattr(obj.user, "email") else None

    def get_wallet_balance(self, obj):
        wallet = getattr(obj, "wallet", None)
        return f"{wallet.current_balance:.2f}" if wallet else "0.00"

    def get_total_earned(self, obj):
        wallet = getattr(obj, "wallet", None)
        return f"{wallet.total_earned:.2f}" if wallet else "0.00"

    def get_today_deliveries(self, obj):
        wallet = getattr(obj, "wallet", None)
        return wallet.today_deliveries if wallet else 0

    def get_zone_name(self, obj):
        return obj.zone.name if obj.zone else None


class StoreDeliveryPartnerCreateUpdateSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False) # Only required for create

    class Meta:
        model = DeliveryPartnerProfile
        fields = [
            "first_name",
            "last_name",
            "email",
            "phone",
            "password",
            "employee_id",
            "dob",
            "gender",
            "blood_group",
            "emergency_contact",
            "address",
            "vehicle_type",
            "vehicle_number",
            "license_number",
            "vehicle_insurance_expiry",
            "joining_date",
            "status",
            "bank_account_number",
            "ifsc_code",
            "bank_name",
            "upi_id",
        ]

