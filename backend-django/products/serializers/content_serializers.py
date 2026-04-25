from rest_framework import serializers

from ..models import Source, WhatYouGet


# ---------------------------
# What You Get Serializer
# ---------------------------
class WhatYouGetSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = WhatYouGet
        fields = ["id", "name", "image_url", "content", "created_at", "updated_at"]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


# ---------------------------
# Source Serializer
# ---------------------------
class SourceSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Source
        fields = ["id", "name", "image_url", "content", "created_at", "updated_at"]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
