# products/mixins.py

from django.core.cache import cache
from django.utils import timezone

from .models import Product, RecentlyViewed


class RecentlyViewedMixin:
    """Mixin to track recently viewed products in ProductDetailView"""

    def add_recently_viewed(self, request, product_id):
        """Add product to recently viewed (authenticated users only)"""
        try:
            # Only track for authenticated users
            if not request.user.is_authenticated:
                return False

            # Verify product exists
            if not Product.objects.filter(
                id=product_id, is_available=True, deleted_at__isnull=True
            ).exists():
                return False

            # Add to recently viewed
            RecentlyViewed.objects.update_or_create(
                user=request.user,
                product_id=product_id,
                defaults={"viewed_at": timezone.now()},
            )

            # Clear cache
            cache.delete(f"recently_viewed_user_{request.user.id}")
            return True

        except Exception as e:
            print(f"Error adding recently viewed: {e}")
            return False
