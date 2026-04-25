# orders/views/order_views.py

from django.http import HttpResponse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from ..serializers import OrderDetailSerializer, OrderTrackingTimelineSerializer
from ..selectors.order_selectors import (
    get_order_for_user_detail,
    get_order_for_user_tracking,
    get_order_address,
    get_delivery_man_info
)
from ..services.order_services import (
    create_order_service,
    reconcile_user_orders_service,
    download_invoice_payload_service,
    preview_invoice_response_service,
    cancel_order_service,
)
from ..services.store_cancel_refund_service import store_cancel_order_service
from ..serializers import DeliveryManInfoSerializer


class CreateOrderView(APIView):
    """Create order and initiate Razorpay payment with discount support"""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        success, message, data, razorpay_order, status_code = create_order_service(request)

        if success:
            return Response(
                {
                    "success": True,
                    "message": message,
                    "data": data,
                    "razorpay_order": razorpay_order,
                },
                status=status.HTTP_201_CREATED,
            )

        # message/data already match your old flow
        if status_code == 404:
            return Response({"success": False, "message": message}, status=status.HTTP_404_NOT_FOUND)

        if data is not None:
            # for cases like amount>460000, payment gateway error etc.
            return Response({"success": False, "message": message, "data": data}, status=status_code)

        return Response({"success": False, "message": message}, status=status_code)


class ReconcileUserOrdersView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        results = reconcile_user_orders_service(request.user)
        return Response(
            {"success": True, "reconciled_orders": results, "count": len(results)}
        )


class OrderDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, order_number):
        order = get_order_for_user_detail(order_number=order_number, user=request.user)
        serializer = OrderDetailSerializer(order, context={"request": request})
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_200_OK)


class OrderTrackingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_number):
        try:
            order = get_order_for_user_tracking(order_number=order_number, user=request.user)
            timeline = order.get_tracking_timeline()
            serializer = OrderTrackingTimelineSerializer(timeline, many=True)
            address_obj = get_order_address(order=order)
            delivery_man_info = get_delivery_man_info(order_number=order_number,  user= request.user)

           

            return Response(
                {
                    "success": True,
                    "order_number": order.order_number,
                    "current_status": order.status,
                    "current_status_display": order.get_status_display(),
                    "estimated_delivery": order.estimated_delivery_date,
                    "delivery_time": order.get_delivery_date(),
                    "address": address_obj.get_full_address(),
                    "timeline": serializer.data,
                    "delivery_man": DeliveryManInfoSerializer(delivery_man_info).data if delivery_man_info else None,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            print(e)
            return Response(
                {"success": False, "error": "Failed to fetch tracking information"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class DownloadOrderInvoiceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_number):
        success, payload, response_obj, status_code = download_invoice_payload_service(
            request, order_number=order_number
        )

        if success:
            return Response(payload, status=status_code)
        return Response(payload, status=status_code)


class PreviewOrderInvoiceAPIView(APIView):
    # permission_classes = [IsAuthenticated]

    def get(self, request, order_number):
        success, payload, response_obj, status_code = preview_invoice_response_service(
            request, order_number=order_number, http_response_class=HttpResponse
        )

        if response_obj is not None:
            return response_obj

        return Response(payload, status=status_code)


class CancelOrderView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        success, message, data, status_code = cancel_order_service(request)
        
        if success:
            return Response(
                {"success": True, "message": message, "data": data},
                status=status.HTTP_200_OK,
            )

        return Response({"success": False, "message": message}, status=status_code)
    
class CancelOrderWithRefundView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # request.data IS the payload dict — don't extract a nested key
        order_number = request.data.get("order_number", "").strip()
        reason = request.data.get("reason", "").strip()
        payload ={
            'order_number':order_number,
            'reason':reason,
            'refundType': "FULL_REFUND",            
        }

        success, message, data, status_code = store_cancel_order_service(
            store_user=request.user,
            payload=payload,
        )

        if success:
            return Response(
                {"success": True, "message": message, "data": data},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"success": False, "message": message},
            status=status_code,
        )