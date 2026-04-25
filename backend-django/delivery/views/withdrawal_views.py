from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal

from delivery.models.partner_models import (
    DeliveryWallet,
    WithdrawalRequest
)


class RequestWithdrawalView(APIView):
    """
    Delivery partner requests withdrawal from wallet
    """

    def post(self, request):

        try:
            partner = request.user.delivery_partner_profile
        except:
            return Response(
                {"success": False, "message": "Delivery partner profile not found."},
                status=status.HTTP_403_FORBIDDEN
            )

        amount = request.data.get("amount")
        payment_mode = request.data.get("payment_mode", "upi")

        if not amount:
            return Response(
                {"success": False, "message": "Amount is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        amount = Decimal(amount)

        wallet, _ = DeliveryWallet.objects.get_or_create(delivery_man=partner)

        # Validation
        if amount <= 0:
            return Response(
                {"success": False, "message": "Invalid withdrawal amount."},
                status=status.HTTP_400_BAD_REQUEST
            )
        MIN_WITHDRAWAL_AMOUNT = Decimal("100")

        if amount < MIN_WITHDRAWAL_AMOUNT:
            return Response(
                {"success": False, "message": f"Minimum withdrawal amount is ₹{MIN_WITHDRAWAL_AMOUNT} rupees."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if amount > wallet.current_balance:
            return Response(
                {"success": False, "message": "Insufficient wallet balance."},
                status=status.HTTP_400_BAD_REQUEST
            )

        withdrawal = WithdrawalRequest.objects.create(
            wallet=wallet,
            amount=amount,
            payment_mode=payment_mode,
            upi_id=request.data.get("upi_id"),
            bank_account_number=request.data.get("bank_account_number"),
            bank_ifsc=request.data.get("bank_ifsc"),
            bank_name=request.data.get("bank_name"),
            account_holder_name=request.data.get("account_holder_name"),
        )

        return Response(
            {
                "success": True,
                "message": "Withdrawal request submitted successfully.",
                "data": {
                    "withdrawal_id": withdrawal.id,
                    "amount": withdrawal.amount,
                    "status": withdrawal.status
                }
            },
            status=status.HTTP_201_CREATED
        )
        
class WithdrawalHistoryView(APIView):

    def get(self, request):

        try:
            partner = request.user.delivery_partner_profile
        except:
            return Response(
                {"success": False, "message": "Delivery partner profile not found."},
                status=status.HTTP_403_FORBIDDEN
            )

        wallet, _ = DeliveryWallet.objects.get_or_create(delivery_man=partner)

        withdrawals = WithdrawalRequest.objects.filter(
            wallet=wallet
        ).order_by("-requested_at")

        data = []

        for w in withdrawals:
            data.append({
                "id": w.id,
                "amount": w.amount,
                "payment_mode": w.payment_mode,
                "status": w.status,
                "requested_at": w.requested_at,
                "resolved_at": w.resolved_at
            })

        return Response({"success": True, "data": data})