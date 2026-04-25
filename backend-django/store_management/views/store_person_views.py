# store_management/api/manager_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from ..models.manager_models import StoreManagerProfile
from ..serializers.store_person_serializer import StoreManagerInfoSerializer
from ..permissions import IsStoreManagerStaff


class StoreManagerMeView(APIView):
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]

    def get(self, request):
        profile = (
            StoreManagerProfile.objects
            .select_related("storage_location")
            .filter(user=request.user)
            .first()
        )

        if not profile:
            return Response(
                {"success": False, "message": "Store manager profile not found for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = StoreManagerInfoSerializer(profile).data
        return Response({"success": True, "data": data}, status=status.HTTP_200_OK)