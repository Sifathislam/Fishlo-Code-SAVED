from rest_framework import serializers

from ..models import Banner


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = [
            "id",
            "title",
            "placement",
            "image_desktop",
            "image_mobile",
            "link_url",
            "starts_at",
            "ends_at",
        ]
