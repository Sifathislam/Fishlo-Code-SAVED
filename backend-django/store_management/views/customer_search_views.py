from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..permissions import IsStoreManagerStaff
from ..selectors.customer_selectors import search_customers_by_phone
from store_management.utils import get_safe_storage_location

class CustomerPhoneSearchView(APIView):
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]

    def get(self, request):
        query = request.query_params.get("q", "")
        if len(query) < 3:
            return Response({"results": []})
        
        storage_location = get_safe_storage_location(request)
        results = search_customers_by_phone(query, storage_location)
        
        return Response({"results": results})
