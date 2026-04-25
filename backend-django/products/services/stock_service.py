from ..serializers import StockNotifyRequestSerializer
from ..utils import get_user_storage_location


def create_stock_notify_request(request):
    serializer = StockNotifyRequestSerializer(
        data=request.data,
        context={
            "request": request,
            "storage_location": get_user_storage_location(request),
        },
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return serializer
