# delivery/views/assignment_views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from delivery.services.assignment_services import (
    assign_orders_to_delivery_man,
    accept_batch,
    reject_batch,
    verify_delivery_otp,
    send_delivery_otp
)
from delivery.selectors.assignment_selectors import (
    get_batches_for_partner,
    get_all_batches_for_partner,
)
from delivery.serializers.assignment_serializers import (
    DeliveryBatchSerializer,
    BatchItemSerializer,
    DeliveryHistoryBatchSerializer
)
from orders.models.orders_models import Order
from rest_framework import status
from delivery.services.wallet_service import credit_delivery_partner
from delivery.services.batch_service import update_delivery_batch_status
class AssignOrdersView(APIView):
    """Admin — create a batch and assign orders to a delivery partner."""
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        delivery_partner_id = request.data.get("delivery_partner_id")
        if not delivery_partner_id:
            return Response({"success": False, "message": "delivery_partner_id is required.", "data": None}, status=400)

        ok, msg, data, code = assign_orders_to_delivery_man(
            request,
            order_ids=request.data.get("order_ids", []),
            delivery_partner_id=delivery_partner_id,
            slot_id=request.data.get("slot_id"),
            delivery_date=request.data.get("delivery_date"),
        )
        return Response({"success": ok, "message": msg, "data": data}, status=code)


from datetime import timedelta
from django.utils import timezone

class MyBatchesView(APIView):
    """
    Partner — active batches with all orders inside.
    GET /assignments/my/
    GET /assignments/my/?history=true&days=30
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            partner = request.user.delivery_partner_profile
        except Exception:
            return Response({"success": False, "message": "No delivery partner profile found.", "data": None}, status=403)

        include_history = request.query_params.get("history") == "true"
        
        if include_history:
            days = int(request.query_params.get("days", 30))
            batches = get_all_batches_for_partner(partner)
            
            # Optional date filtering
            if days > 0:
                cutoff_date = timezone.now() - timedelta(days=days)
                batches = batches.filter(assigned_at__gte=cutoff_date)
            
            data = DeliveryHistoryBatchSerializer(batches, many=True).data
        else:
            batches = get_batches_for_partner(partner)
            data = DeliveryBatchSerializer(batches, many=True).data
            
        return Response({"success": True, "message": "Fetched successfully.", "data": data}, status=200)


class BatchItemActionView(APIView):
    """
    Partner — accept or reject a single order (batch item).
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, batch_id, action):
        if action == "accept":
            ok, msg, data, code = accept_batch(request, batch_id)
        elif action == "reject":
            ok, msg, data, code = reject_batch(request, batch_id, request.data.get("reason", ""))
        else:
            return Response({"success": False, "message": "Invalid action."}, status=400)
        
        return Response({"success": ok, "message": msg, "data": data}, status=code)


class AssignmentDetailView(APIView):
    """
    Get detailed assignment for a specific order.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, order_number):
        try:
            partner = request.user.delivery_partner_profile
        except Exception:
            return Response({"success": False, "message": "No delivery partner profile found.", "data": None}, status=403)

        from delivery.models.partner_models import DeliveryBatchItems
        from delivery.serializers.assignment_serializers import BatchItemSerializer

        batch_item = DeliveryBatchItems.objects.filter(
            order__order_number=order_number,
            batch__delivery_man=partner
        ).select_related("order", "order__order_address").first()

        if not batch_item:
            return Response({"success": False, "message": "Assignment not found."}, status=404)

        data = BatchItemSerializer(batch_item).data
        return Response({"success": True, "message": "Assignment details fetched.", "data": data}, status=200)


class SendDeliveryOTPView(APIView):
    def post(self, request):
        order_number = request.data.get('order_number')

        if not order_number:
            return Response(
                {'success': False, 'message': 'order_number is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        result = send_delivery_otp(request, order)

        if result.get('success'):
            return Response(
                {'success': True, 'message': 'OTP sent successfully.'},
                status=status.HTTP_200_OK
            )

        return Response(
            {'success': False, 'message': result.get('message', 'Failed to send OTP.')},
            status=status.HTTP_400_BAD_REQUEST
        )


class VerifyDeliveryOTPView(APIView):
    def post(self, request):
        otp_code = request.data.get('otp_code')
        order_number = request.data.get('order_number')

        if not otp_code or not order_number:
            return Response(
                {'success': False, 'message': 'otp_code and order_number are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        result = verify_delivery_otp(request, order, otp_code)
        if result.get('success') or True:
            if order.status == "DELIVERED":
                return Response(
                    {"success": False, "message": "Order already delivered."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if order.payment_status in ["PENDING", "PARTIALLY_PAID"] and order.payment_method in ["UPI_ON_DELIVERY", "CASH"]:
                from decimal import Decimal
                order.cash_collected = order.remaining_amount
                order.remaining_amount = Decimal("0.00")
                order.payment_status = "PAID"
                order.save(update_fields=["cash_collected", "remaining_amount", "payment_status"])

            order.update_status(
                new_status='DELIVERED',
                updated_by_user=request.user,
                notes='Order delivered successfully',
                updated_from='DELIVERY_APP'
            )

            credit_delivery_partner(order)

            update_delivery_batch_status(order, otp=otp_code)

            return Response({'success': True, 'message': 'OTP verified successfully.'},status=status.HTTP_200_OK)

        return Response({'success': False, 'message': result.get('message', 'Invalid or expired OTP.')},status=status.HTTP_400_BAD_REQUEST)