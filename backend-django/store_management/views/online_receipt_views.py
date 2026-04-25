# orders/api/views/online_receipt_views.py

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from orders.models.orders_models import Order
from store_management.services.receipt_service import build_online_order_receipt
from accounts.models.company_models import CompanyInfo  
from ..services.receipt_service import build_manual_order_receipt
from store_management.utils import get_safe_storage_location
from ..permissions import IsStoreManagerStaff

class OnlineOrderReceiptView(APIView):
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]

    def get(self, request, order_number):
        order = (
            Order.objects
            .select_related("user", "order_address", "delivery_slot")
            .prefetch_related("order_items__selected_cuts")
            .filter(order_number=order_number)
            .first()
        )

        if not order:
            return Response(
                {"success": False, "message": "Order not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        company = CompanyInfo.objects.filter(is_active=True).first()
        storage = get_safe_storage_location(request)


        if order.source == 'ONLINE':
            receipt = build_online_order_receipt(order=order, company=company,storage=storage, width=32)
        else:
            receipt = build_manual_order_receipt(order=order, company=company, width=32)

        return Response(
            {
                "success": True,
                "order_number": order.order_number,
                "token_number": order.token_number,
                "receipt": receipt,
            },
            status=status.HTTP_200_OK,
        )