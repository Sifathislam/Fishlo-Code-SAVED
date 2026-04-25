from ..models import Review


def get_approved_reviews_for_product(product):
    return (
        Review.objects.filter(product=product, is_approved=True)
        .select_related("user")
        .order_by("-created_at")
    )
