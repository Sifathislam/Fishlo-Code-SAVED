from payments.models import Payment


def get_user_transactions(user):
    return Payment.objects.filter(user=user).exclude(status='PENDING').order_by("-created_at")
