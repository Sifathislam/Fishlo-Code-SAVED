from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from payments.serializers import PaymentHistorySerializer
from ..selectors.payment_selectors import get_user_transactions


class UserTransactionListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        transactions = get_user_transactions(request.user)

        paginator = PageNumberPagination()
        paginator.page_size = 10

        result_page = paginator.paginate_queryset(transactions, request)

        if result_page is not None:
            serializer = PaymentHistorySerializer(result_page, many=True)
            return Response(
                {
                    "count": paginator.page.paginator.count,
                    "next": paginator.get_next_link(),
                    "previous": paginator.get_previous_link(),
                    "page_size": paginator.page_size,
                    "results": serializer.data,
                }
            )

        serializer = PaymentHistorySerializer(transactions, many=True)
        return Response(serializer.data)
