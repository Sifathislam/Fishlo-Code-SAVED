from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import DeliveryPartnerProfile, DeliveryWallet


@receiver(post_save, sender=DeliveryPartnerProfile)
def create_delivery_wallet(sender, instance, created, **kwargs):
    if not created:
        return

    DeliveryWallet.objects.get_or_create(delivery_man=instance)