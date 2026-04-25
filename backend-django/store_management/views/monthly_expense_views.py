from rest_framework import generics, permissions
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from ..models.monthly_expense_models import MonthlyExpense, ExpenseHistory
from ..serializers.monthly_expense_serializers import MonthlyExpenseSerializer
from ..permissions import IsStoreManagerStaff

from orders.services.analytics_services import parse_date_range

class MonthlyExpenseListCreateView(generics.ListCreateAPIView):
    serializer_class = MonthlyExpenseSerializer
    permission_classes = [permissions.IsAuthenticated, IsStoreManagerStaff]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['expense_date', 'category', 'cost_type']
    pagination_class = None

    def get_queryset(self):
        qs = MonthlyExpense.objects.none()
        if hasattr(self.request.user, "store_manager_profile"):
            location = self.request.user.store_manager_profile.storage_location
            qs = MonthlyExpense.objects.filter(storage_location=location)

            # Check if global filters are applied
            period = self.request.query_params.get("period")
            start_str = self.request.query_params.get("start")
            end_str = self.request.query_params.get("end")

            if period or start_str or end_str:
                start, end = parse_date_range(period=period or "14", start_str=start_str, end_str=end_str)
                # Filter by expense_date range
                qs = qs.filter(expense_date__gte=start, expense_date__lte=end)

        return qs

    def perform_create(self, serializer):
        location = self.request.user.store_manager_profile.storage_location
        expense = serializer.save(storage_location=location, created_by=self.request.user)
        ExpenseHistory.objects.create(
            expense=expense,
            action=ExpenseHistory.Action.CREATED,
            user=self.request.user,
            cost_type=expense.cost_type,
            category=expense.category,
            custom_category=expense.custom_category,
            amount=expense.amount,
            description=expense.description,
            expense_date=expense.expense_date
        )

class MonthlyExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MonthlyExpenseSerializer
    permission_classes = [permissions.IsAuthenticated, IsStoreManagerStaff]

    def get_queryset(self):
        if hasattr(self.request.user, "store_manager_profile"):
            location = self.request.user.store_manager_profile.storage_location
            return MonthlyExpense.objects.filter(storage_location=location)
        return MonthlyExpense.objects.none()

    def perform_update(self, serializer):
        expense = serializer.save()
        ExpenseHistory.objects.create(
            expense=expense,
            action=ExpenseHistory.Action.UPDATED,
            user=self.request.user,
            cost_type=expense.cost_type,
            category=expense.category,
            custom_category=expense.custom_category,
            amount=expense.amount,
            description=expense.description,
            expense_date=expense.expense_date
        )

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()
        ExpenseHistory.objects.create(
            expense=instance,
            action=ExpenseHistory.Action.DELETED,
            user=self.request.user,
            cost_type=instance.cost_type,
            category=instance.category,
            custom_category=instance.custom_category,
            amount=instance.amount,
            description=instance.description,
            expense_date=instance.expense_date
        )
