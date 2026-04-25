from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers import BannerSerializer
from ..selectors.home_selectors import get_first_banner
from ..services.subscriber_service import create_subscriber


from concurrent.futures import ThreadPoolExecutor, as_completed

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from products.serializers.product_serializers import ProductListSerializer
from products.utils import get_user_storage_location
from promotions.serializers.banner_serializers import BannerSerializer
from products.serializers.category_serializers import CategoryWithSubCategorySerializer
from policies.serializers.faq_serializers import FAQSerializer

from ..selectors.home_selectors import (
    get_home_banners,
    get_most_loved_products,
    get_signature_products,
    get_shop_by_categories,
    get_home_faqs,
)

class BannerListAPIView(generics.GenericAPIView):
    serializer_class = BannerSerializer

    def get(self, request, *args, **kwargs):
        banner = get_first_banner()
        serializer = self.get_serializer(banner, context={"request": request})
        return Response(serializer.data)


class SubscribeAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer, ok = create_subscriber(data=request.data, user=request.user)

        if ok:
            return Response(
                {"success": True, "message": "Subscribed successfully!"},
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
# content/views/home_views.py


class HomePageAPIView(APIView):
    """
    Single endpoint that returns ALL home screen data in one shot.
    Sections are fetched in parallel using ThreadPoolExecutor.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def get(self, request):
        storage_location = get_user_storage_location(request)
        serializer_context = {"request": request, "storage_location": storage_location}

        # ── Define each section as a callable ──────────────────────────────
        def fetch_hero_banners():
            qs = get_home_banners("HOME_TOP_BANNER")
            return BannerSerializer(qs, many=True, context=serializer_context).data

        def fetch_middle_banners():
            qs = get_home_banners("HOME_MIDDLE_BANNER")
            return BannerSerializer(qs, many=True, context=serializer_context).data

        def fetch_bottom_banners():
            qs = get_home_banners("HOME_BOTTOM_BANNER")
            return BannerSerializer(qs, many=True, context=serializer_context).data

        def fetch_most_loved():
            qs = get_most_loved_products(request)[:10]
            return ProductListSerializer(qs, many=True, context=serializer_context).data

        def fetch_signature():
            qs = get_signature_products(request)
            return ProductListSerializer(qs, many=True, context=serializer_context).data

        # ── Run all in parallel ─────────────────────────────────────────────
        tasks = {
            "hero_banners":     fetch_hero_banners,
            "middle_banners":   fetch_middle_banners,
            "bottom_banners":   fetch_bottom_banners,
            "most_loved":       fetch_most_loved,
            "signature_seafood": fetch_signature,
        }

        results = {}
        errors = {}

        with ThreadPoolExecutor(max_workers=7) as executor:
            future_to_key = {executor.submit(fn): key for key, fn in tasks.items()}
            for future in as_completed(future_to_key):
                key = future_to_key[future]
                try:
                    results[key] = future.result()
                except Exception as exc:
                    errors[key] = str(exc)
                    results[key] = []   # graceful degradation — never crash the whole page

        response_data = {
            "hero_banners":      results.get("hero_banners", []),
            "middle_banners":    results.get("middle_banners", []),
            "bottom_banners":    results.get("bottom_banners", []),
            "most_loved":        results.get("most_loved", []),
            "signature_seafood": results.get("signature_seafood", []),
        }

        # Optionally expose errors in debug mode
        from django.conf import settings
        if settings.DEBUG and errors:
            response_data["_errors"] = errors

        return Response(response_data)