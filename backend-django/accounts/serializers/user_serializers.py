# accounts/serializers/user_serializers.py

from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["uuid", "phone_number"]
        read_only_fields = ["uuid", "phone_number"]
