from delivery.serializers.partner_serializers import DeliveryPartnerProfileSerializer

def get_partner_profile(partner, request=None):
    """
    Returns serialized profile data for a delivery partner.
    """
    serializer = DeliveryPartnerProfileSerializer(partner, context={"request": request})
    return serializer.data
