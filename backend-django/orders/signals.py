from django.db import transaction
from django.db.models import Q
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone

from .models.orders_models import  Order, OrderAddress, OrderTracking
from .models.cart_models import Cart



@receiver(post_save, sender=Cart, dispatch_uid="ensure_single_active_cart")
def ensure_single_active_cart(sender, instance, **kwargs):
    if not instance.is_active:
        return

    qs = Cart.objects.filter(is_active=True).exclude(id=instance.id)

    if instance.user:
        qs = qs.filter(user=instance.user)
    else:
        qs = qs.filter(session_key=instance.session_key)

    qs.update(is_active=False)

