# delivery/selectors/dashboard_selectors.py
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum

from delivery.models.partner_models import DeliveryWallet, WalletTransaction, DeliveryBatchItems


def get_dashboard_stats(partner):
    today = timezone.now().date()
    yesterday = today - timedelta(days=1)
    last_7_days = today - timedelta(days=7)

    # Earnings
    wallet, _ = DeliveryWallet.objects.get_or_create(delivery_man=partner)
    today_earnings = wallet.today_earned

    if wallet:
        yesterday_earnings = WalletTransaction.objects.filter(
            wallet=wallet,
            transaction_type='credit',
            created_at__date=yesterday
        ).aggregate(total=Sum('amount'))['total'] or 0.00

        last_7_days_earnings = WalletTransaction.objects.filter(
            wallet=wallet,
            transaction_type='credit',
            created_at__date__gte=last_7_days
        ).aggregate(total=Sum('amount'))['total'] or 0.00
    else:
        yesterday_earnings = 0.00
        last_7_days_earnings = 0.00

    # Orders completed today
    completed_today = DeliveryBatchItems.objects.filter(
        batch__delivery_man=partner,
        order__status="DELIVERED",
        batch__completed_at__date=today
    ).count()

    # If completed_at is not reliably set on the batch, we can check the order's delivered_at date:
    if completed_today == 0:
        completed_today = DeliveryBatchItems.objects.filter(
            batch__delivery_man=partner,
            order__status="DELIVERED",
            order__delivered_at__date=today
        ).count()

    # Pending orders (accepted or in_progress batches, order not delivered/cancelled)
    pending_orders = DeliveryBatchItems.objects.filter(
        batch__delivery_man=partner,
        batch__status__in=["accepted", "in_progress"],
    ).exclude(
        order__status__in=["DELIVERED", "CANCELLED", "FAILED"]
    ).count()

    return {
        "today_earnings": f"{today_earnings:.2f}",
        "yesterday_earnings": f"{yesterday_earnings:.2f}",
        "last_7_days_earnings": f"{last_7_days_earnings:.2f}",
        "completed_today": completed_today,
        "pending_orders": pending_orders,
        "wallet_balance": f"{wallet.current_balance:.2f}" if wallet else "0.00",
    }
