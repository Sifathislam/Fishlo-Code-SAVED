from django.utils import timezone
from rest_framework import serializers

from ..models import Banner, Offer, Subscriber


class BannerSerializer(serializers.ModelSerializer):
    left_side_image = serializers.SerializerMethodField()
    right_side_image = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = ["id", "title", "left_side_image", "right_side_image"]

    def get_full_url(self, url):
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(url)
        return url  # fallback

    def get_active_offer(self, banner):
        now = timezone.now()
        offers = banner.offers.filter(active=True).order_by("-start_date")

        for offer in offers:
            if offer.start_date <= now and (
                offer.end_date is None or offer.end_date >= now
            ):
                return offer
        return None

    def get_left_side_image(self, banner):
        offer = self.get_active_offer(banner)
        if offer and offer.left_side_offer_image:
            return self.get_full_url(offer.left_side_offer_image.url)

        return (
            self.get_full_url(banner.left_side_image.url)
            if banner.left_side_image
            else None
        )

    def get_right_side_image(self, banner):
        offer = self.get_active_offer(banner)
        if offer and offer.right_side_offer_image:
            return self.get_full_url(offer.right_side_offer_image.url)

        return (
            self.get_full_url(banner.right_side_image.url)
            if banner.right_side_image
            else None
        )
