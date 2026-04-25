from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers import BannerSerializer
from ..selectors.banner_selectors import get_active_banners_for_placement


class BannerAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        placement = request.query_params.get("placement")
        if not placement:
            return Response(
                {"detail": "placement query param is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = get_active_banners_for_placement(placement=placement)
        serializer = BannerSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)
