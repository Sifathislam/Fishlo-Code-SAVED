from rest_framework import serializers

from ..models import Category, SubCategory


# --------------------------
# CategoryMinimalSerializer
# --------------------------
class CategoryMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


# --------------------------
# SubCategoryMinimalSerializer
# --------------------------
class SubCategoryMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ["id", "name", "slug"]


# --------------------------
# SubCategorySerializer
# --------------------------
class SubCategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = SubCategory
        fields = ["id", "name", "slug", "image"]

    def get_image(self, obj):
        if obj.image:
            request = self.context.get("request")
            return (
                request.build_absolute_uri(obj.image.url) if request else obj.image.url
            )
        return None


# --------------------------
# CategoryWithSubCategorySerializer
# --------------------------
class CategoryWithSubCategorySerializer(serializers.ModelSerializer):
    subcategories = SubCategorySerializer(many=True, read_only=True)
    image = serializers.SerializerMethodField()
    subcategory_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "image", "subcategory_count", "subcategories"]

    def get_image(self, obj):
        if obj.image:
            request = self.context.get("request")
            return (
                request.build_absolute_uri(obj.image.url) if request else obj.image.url
            )
        return None

    def get_subcategory_count(self, obj):
        return obj.subcategories.count()
