from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from ..selectors.payment_selectors import (
    get_latest_payment_for_order,
    get_pending_payment_for_order,
    get_user_order_by_id,
    get_user_order_by_number,
)
from ..services.order_payment_service import OrderPaymentService
from ..services.payment_reconciliation import PaymentReconciliationService
from ..services.payment_service import PaymentService


class ManualPaymentCheckView(APIView):
    """
    Manual "Check Payment Status" button on order details page.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, order_number):
        try:
            order = get_user_order_by_number(order_number=order_number, user=request.user)
        except Exception:
            return Response(
                {"success": False, "message": "Order not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        reconciliation = PaymentReconciliationService()
        result = reconciliation.reconcile_single_order(order.id)

        if not result:
            return Response(
                {"success": False, "message": "No pending payment to check"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(result)


class VerifyPaymentView(APIView):
    """Enhanced version with better error handling"""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get("order_id")
        payment_data = request.data.get("payment_data", {})

        if not order_id:
            return Response(
                {"success": False, "message": "Order ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = get_user_order_by_id(order_id=order_id, user=request.user)
        except Exception:
            return Response(
                {"success": False, "message": "Order not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if order.payment_status == "PAID":
            return Response(
                {
                    "success": True,
                    "message": "Payment already verified",
                    "data": {
                        "order_id": order.id,
                        "order_number": order.order_number,
                        "payment_status": order.payment_status,
                    },
                }
            )

        payment = get_pending_payment_for_order(order)
        if not payment:
            return Response(
                {"success": False, "message": "No pending payment found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service = OrderPaymentService()

        try:
            ok = service.verify_payment_and_finalize_order(
                request=request,
                user=request.user,
                order=order,
                payment=payment,
                payment_data=payment_data,
            )

            if ok:
                return Response(
                    {
                        "success": True,
                        "message": "Payment verified successfully",
                        "data": {
                            "order_id": order.id,
                            "order_number": order.order_number,
                            "payment_status": order.payment_status,
                            "order_status": order.status,
                        },
                    }
                )

            return Response(
                {"success": False, "message": "Payment verification failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            print(e)
            service.mark_payment_failed_with_exception(payment=payment, error_message=str(e))
            return Response(
                {"success": False, "message": f"Payment verification error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CheckPaymentStatusView(APIView):
    """Check payment status from Razorpay"""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        try:
            order = get_user_order_by_id(order_id=order_id, user=request.user)
        except Exception:
            return Response(
                {"success": False, "message": "Order not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        payment = get_latest_payment_for_order(order)

        if not payment:
            return Response(
                {"success": False, "message": "No payment found for this order"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not payment.gateway_payment_id:
            return Response(
                {
                    "success": True,
                    "data": {
                        "order_id": order.id,
                        "order_number": order.order_number,
                        "payment_id": payment.id,
                        "payment_status": payment.status,
                        "local_status": True,
                    },
                },
                status=status.HTTP_200_OK,
            )

        try:
            payment_service = PaymentService()
            gateway_status = payment_service.check_payment_status(payment.gateway_payment_id)

            return Response(
                {
                    "success": True,
                    "data": {
                        "order_id": order.id,
                        "order_number": order.order_number,
                        "payment_id": payment.id,
                        "payment_status": payment.status,
                        "gateway_status": gateway_status,
                        "gateway_payment_id": payment.gateway_payment_id,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"success": False, "message": f"Error checking payment status: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
