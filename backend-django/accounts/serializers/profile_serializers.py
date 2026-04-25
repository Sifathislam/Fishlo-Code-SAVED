# accounts/serializers/profile_serializers.py

from django.contrib.auth import get_user_model
from rest_framework import serializers

from ..models import UserProfile

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False)
    profile_image = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()
    phone_number = serializers.CharField(source="user.phone_number", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "phone_number",
            "first_name",
            "last_name",
            "email",
            "phone_verified",
            "total_spent",
            "total_orders",
            "profile_image",
            "cover_image",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "phone_verified",
            "total_spent",
            "total_orders",
            "created_at",
            "updated_at",
        ]

    def validate_email(self, value):
        user = self.context["request"].user

        if value:
            if User.objects.filter(email=value).exclude(id=user.id).exists():
                raise serializers.ValidationError("This email is already in use.")
        return value

    def update(self, instance, validated_data):
        user = self.context["request"].user

        email = validated_data.pop("email", None)
        if email:
            user.email = email
            user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance

    def get_profile_image(self, obj):
        if obj.profile_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url
        return None

    def get_cover_image(self, obj):
        if obj.cover_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return None


class AccountSettingsSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="profile.first_name", allow_blank=True, required=False)
    last_name = serializers.CharField(source="profile.last_name", allow_blank=True, required=False)
    profile_image = serializers.ImageField(source="profile.profile_image", required=False, allow_null=True)
    cover_image = serializers.ImageField(source="profile.cover_image", required=False, allow_null=True)
    phone_number = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ["phone_number", "email", "first_name", "last_name", "profile_image","cover_image"]

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", {})

        instance.email = validated_data.get("email", instance.email)
        instance.save()

        profile, _ = UserProfile.objects.get_or_create(user=instance)
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()

        return instance
