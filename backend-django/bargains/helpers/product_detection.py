from inventory.models import Inventory
from django.db.models import Q
import re

def detect_product_from_message(user_text, storage_location):
    """
    Detect product mentioned in user message
    Only considers products available in this storage_location
    """
    if not user_text or not storage_location:
        return []

    user_text_lower = user_text.lower()
    detected_products = []

    # Get all products available in this store
    inventories = Inventory.objects.select_related("product").prefetch_related("product__tags").filter(
        storagelocation=storage_location
    )

    for inv in inventories:
        product = inv.product

        for tag in product.tags.all():
            tag_name = tag.name.lower()
            pattern = r'\b' + re.escape(tag_name) + r'\b'

            if re.search(pattern, user_text_lower):
                detected_products.append(product)
                break
    print('detected products==>', detected_products)
    print("***********************")
    return detected_products