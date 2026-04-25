from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from delivery.services.partner_services import update_active_duty_status
from delivery.serializers.partner_serializers import ProfileImageSerializer, ChangePasswordSerializer
from delivery.selectors.profile_selectors import get_partner_profile

class PartnerStatusView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            partner = request.user.delivery_partner_profile
            return Response({
                "success": True,
                "data": {
                    "is_active_duty": partner.is_active_duty,
                    "full_name": f"{partner.first_name} {partner.last_name}",
                    "phone": str(partner.user.phone_number) if hasattr(partner.user, "phone_number") else None,
                }
            }, status=status.HTTP_200_OK)
        except Exception:
            return Response({
                "success": False,
                "message": "Delivery partner profile not found."
            }, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request):
        is_active = request.data.get("is_active_duty")
        if is_active is None:
            return Response({"success": False, "message": "is_active_duty field is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        success, message, data, status_code = update_active_duty_status(request, is_active)
        return Response({
            "success": success,
            "message": message,
            "data": data
        }, status=status_code)


class DeliveryPartnerProfileView(APIView):
    """
    View for delivery partner profile.
    GET: Retrieve full profile details.
    PATCH: Update profile image.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        try:
            partner = request.user.delivery_partner_profile
        except Exception:
            return Response({
                "success": False, 
                "message": "Delivery partner profile not found."
            }, status=status.HTTP_404_NOT_FOUND)
        
        data = get_partner_profile(partner, request)
        return Response({
            "success": True,
            "message": "Profile details fetched successfully.",
            "data": data
        }, status=status.HTTP_200_OK)

    def patch(self, request):
        try:
            partner = request.user.delivery_partner_profile
        except Exception:
            return Response({
                "success": False, 
                "message": "Delivery partner profile not found."
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = ProfileImageSerializer(partner, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Profile picture updated successfully.",
                "data": {"profile_image": request.build_absolute_uri(partner.profile_image.url) if partner.profile_image else None}
            }, status=status.HTTP_200_OK)
        
        return Response({
            "success": False,
            "message": "Validation failed.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class DeliveryPartnerChangePasswordView(APIView):
    """
    View for delivery partner to change their login password.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return Response({
                "success": True, 
                "message": "Password updated successfully."
            }, status=status.HTTP_200_OK)
        
        return Response({
            "success": False,
            "message": "Validation failed.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
