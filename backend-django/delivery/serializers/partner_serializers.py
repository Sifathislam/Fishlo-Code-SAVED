from rest_framework import serializers
from delivery.models.partner_models import DeliveryPartnerProfile, DeliveryWallet

class DeliveryPartnerProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()
    zone_name = serializers.SerializerMethodField()
    wallet_balance = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryPartnerProfile
        fields = [
            "employee_id",
            "full_name",
            "first_name",
            "last_name",
            "phone",
            "dob",
            "gender",
            "blood_group",
            "profile_image",
            "emergency_contact",
            "address",
            "vehicle_type",
            "vehicle_number",
            "license_number",
            "joining_date",
            "status",
            "is_active_duty",
            "zone_name",
            "wallet_balance",
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_phone(self, obj):
        return str(obj.user.phone_number) if hasattr(obj.user, "phone_number") else None

    def get_profile_image(self, obj):
        if obj.profile_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url
        return None

    def get_zone_name(self, obj):
        return obj.zone.name if obj.zone else None

    def get_wallet_balance(self, obj):
        wallet = getattr(obj, "wallet", None)
        if wallet:
            return f"{wallet.current_balance:.2f}"
        return "0.00"


class ProfileImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryPartnerProfile
        fields = ["profile_image"]

    def validate_profile_image(self, value):
        if not value:
            raise serializers.ValidationError("No image provided.")
        return value

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is not correct.")
        return value
