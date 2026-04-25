from django.utils import timezone
from rest_framework import serializers

from ..models import Banner, Offer, Subscriber


class SubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscriber
        fields = ["id", "email", "user", "created_at"]
        read_only_fields = ["user", "created_at"]
