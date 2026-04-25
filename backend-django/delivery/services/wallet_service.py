from django.db import transaction
from delivery.models.partner_models import (
    DeliveryWallet,
    DeliveryBatchItems,
    WalletTransaction,
    DeliveryLog,
)


def credit_delivery_partner(order):

    batch_item = (
        DeliveryBatchItems.objects
        .filter(order=order)
        .select_related("batch__delivery_man")
        .last()
    )

    if not batch_item:
        return False, "Batch item not found"

    delivery_partner = batch_item.batch.delivery_man

    wallet, _ = DeliveryWallet.objects.get_or_create(
        delivery_man=delivery_partner
    )

    # PREVENT DOUBLE CREDIT
    already_credited = WalletTransaction.objects.filter(
        wallet=wallet,
        order=order,
        transaction_type="credit",
        note__icontains=order.order_number
    ).exists()
    
    if already_credited:
        return False, "Wallet already credited for this order"

    amount = order.delivery_charge

    try:
        with transaction.atomic():

            wallet.credit(
                amount=amount,
                order=order,
                note=f"Delivery earnings for Order {order.order_number}"
            )
            
            DeliveryLog.objects.create(
                batch_item=batch_item,
                event="delivered",
                note=f"Order delivered. ₹{amount} credited to wallet."
            )

        return True, "Wallet credited successfully"

    except Exception as e:
        return False, str(e)