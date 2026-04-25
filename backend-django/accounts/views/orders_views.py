from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.serializers import OrderSerializer
from ..selectors.order_selectors import get_user_orders_queryset


class MyOrdersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = get_user_orders_queryset(request.user)

        status_filter = request.query_params.get("status", None)

        if status_filter and status_filter != "ALL":
            queryset = queryset.filter(status=status_filter)

        paginator = PageNumberPagination()
        paginator.page_size = 10

        result_page = paginator.paginate_queryset(queryset, request)

        if result_page is not None:
            serializer = OrderSerializer(result_page, many=True, context={"request": request})
            return Response(
                {
                    "count": paginator.page.paginator.count,
                    "next": paginator.get_next_link(),
                    "previous": paginator.get_previous_link(),
                    "page_size": paginator.page_size,
                    "results": serializer.data,
                }
            )

        serializer = OrderSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)
