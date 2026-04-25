from rest_framework import serializers

from accounts.models import User

from ..models import Review


# --------------------------
# ReviewUserSerializer
# --------------------------
class ReviewUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "phone_number"]


# --------------------------
# ProductReviewSerializer
# --------------------------
class ProductReviewSerializer(serializers.ModelSerializer):
    user = ReviewUserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ["id", "user", "comment", "star", "created_at"]


# --------------------------
# CreateReviewSerializer
# --------------------------
class CreateReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["comment", "star"]

    def validate_star(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_comment(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Comment must be at least 10 characters.")
        return value.strip()
