from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from ..selectors.category_selectors import get_category_list_queryset
from ..serializers import CategoryWithSubCategorySerializer


# --------------------------
# CategoryListView
# --------------------------
class CategoryListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        categories = get_category_list_queryset()

        serializer = CategoryWithSubCategorySerializer(
            categories, many=True, context={"request": request}
        )

        return Response(serializer.data, status=status.HTTP_200_OK)
