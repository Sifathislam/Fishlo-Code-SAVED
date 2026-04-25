from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from rest_framework import generics, status
from ..serializers.manual_order_serializers import ManualOrderProductListSerializer
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from products.selectors import get_products_list_queryset
from products.utils import get_user_storage_location
from store_management.utils import get_safe_storage_location
from ..services.receipt_service import build_manual_order_receipt,build_staff_kitchen_ticket
from orders.models.orders_models import Order
from ..serializers.manual_order_serializers import ManualOrderCreateSerializer
from ..services.manual_order_service import create_manual_order_service
from accounts.models import CompanyInfo
from ..permissions import IsStoreManagerStaff
from django.db.models import Q, OuterRef, Subquery, Value, Case, When, DecimalField
from django.db.models.functions import Coalesce
from inventory.models import Inventory
from ..services.create_sms_receipt import create_manual_order_receipt_link_and_sms
class CreateManualOrderView(APIView):
    permission_classes = [IsAuthenticated,IsStoreManagerStaff]  # store person / staff

    def post(self, request):
        ser = ManualOrderCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        order = create_manual_order_service(request=request, data=ser.validated_data)
        company = CompanyInfo.objects.filter(is_active=True).first()
        storage = get_safe_storage_location(request)
        customer_receipt = build_manual_order_receipt(order=order, company=company, storage=storage, width=32)
        try:
            link = create_manual_order_receipt_link_and_sms(request=request, order=order,receipt_text=customer_receipt)
            print(link)
        except Exception as e:
                print("e", e)
                print("Receipt link/SMS creation failed for manual order", order.order_number)

        return Response(
            {
                "success": True,
                "message": "Manual order created successfully",
                "data": {
                    "order_id": order.id,
                    "order_number": order.order_number,
                    "subtotal": str(order.subtotal),
                    "discount_amount": str(order.discount_amount),
                    "total_amount": str(order.total_amount),
                    "payment_status": order.payment_status,
                    "status": order.status,
                },
            },
            status=status.HTTP_201_CREATED,
        )


# ------------------
# ProductPagination
# ------------------
class ProductPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# -----------------
# ProductListView
# -----------------
class ManualProductListView(generics.ListAPIView):
    serializer_class = ManualOrderProductListSerializer
    pagination_class = ProductPagination
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def get_queryset(self):
        storage_location = get_safe_storage_location(self.request)
        queryset = get_products_list_queryset(self.request, manual_order_page=True, storage_location=storage_location)
        search_query = self.request.query_params.get("search", None)

        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query)
                | Q(category__name__icontains=search_query)
                | Q(cuts__name__icontains=search_query)
            ).distinct()

        # storage_location already fetched above

        # stock for that location (fast + DB-level ordering)
        inv_qs = Inventory.objects.filter(
            product=OuterRef("pk"),
            storagelocation=storage_location,
        )

        stock_kg_sq = inv_qs.values("stock_kg")[:1]
        stock_pieces_sq = inv_qs.values("stock_pieces")[:1]

        queryset = queryset.annotate(
            product_max_stock=Case(
                When(
                    sell_type="WEIGHT",
                    then=Coalesce(Subquery(stock_kg_sq), Value(0)),
                ),
                default=Coalesce(Subquery(stock_pieces_sq), Value(0)),
                output_field=DecimalField(max_digits=12, decimal_places=3),
            )
        ).order_by("-product_max_stock", "name")

        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["storage_location"] = get_safe_storage_location(self.request)
        return context
class ManualOrderReceiptView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_number):
        order = (
            Order.objects
            .prefetch_related("order_items__selected_cuts")
            .filter(order_number=order_number)
            .first()
        )

        if not order:
            return Response(
                {"success": False, "message": "Order not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        receipt_type = request.query_params.get("receipt_type", "both").lower()
        storage = get_safe_storage_location(request)

        customer_receipt = None
        staff_receipt = None

        # Generate based on param
        if receipt_type in ("both", "customer"):
            company = CompanyInfo.objects.filter(is_active=True).first()
            
            customer_receipt = build_manual_order_receipt(
                order=order, company=company, storage=storage, width=32
            )

        if receipt_type in ("both", "staff"):
            staff_receipt = build_staff_kitchen_ticket(order=order, width=32)

        return Response(
            {
                "success": True,
                "order_number": order_number,
                "token_number": order.token_number,
                "customer_receipt": customer_receipt,   # will be None if not needed
                "staff_receipt": staff_receipt,         # will be None if not needed
            },
            status=status.HTTP_200_OK,
        )