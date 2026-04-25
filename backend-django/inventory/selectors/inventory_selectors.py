from products.models.product_models import PriceMatrix
def get_price_matrix(product, storage_location):
    return PriceMatrix.objects.filter(
        product=product,
        storage_location=storage_location
    ).first()
