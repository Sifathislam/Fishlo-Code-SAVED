from django.contrib import admin
from .models import StoreManagerProfile

@admin.register(StoreManagerProfile)
class StoreManagerProfileAdmin(admin.ModelAdmin):
    list_display = [
        "first_name",
        "last_name",
        "employee_id",
        "storage_location",
        "status",
        "is_active_duty",
    ]
    list_filter = ["status", "is_active_duty", "storage_location"]
    search_fields = ["first_name", "last_name", "employee_id", "user__phone_number"]

from .models.monthly_expense_models import MonthlyExpense, ExpenseHistory

@admin.register(MonthlyExpense)
class MonthlyExpenseAdmin(admin.ModelAdmin):
    list_display = ["id", "category", "custom_category", "amount", "expense_date", "storage_location", "created_by", "is_deleted", "created_at"]
    list_filter = ["is_deleted", "cost_type", "category", "expense_date", "storage_location"]
    search_fields = ["description", "custom_category"]

    def get_queryset(self, request):
        # Override to show both active and deleted expenses in admin
        return self.model.all_objects.all()

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
        action = ExpenseHistory.Action.UPDATED if change else ExpenseHistory.Action.CREATED
        self._create_snapshot(request, obj, action)

    def delete_model(self, request, obj):
        # Soft delete
        obj.is_deleted = True
        obj.save()
        self._create_snapshot(request, obj, ExpenseHistory.Action.DELETED)

    def delete_queryset(self, request, queryset):
        # Bulk soft delete
        for obj in queryset:
            obj.is_deleted = True
            obj.save()
            self._create_snapshot(request, obj, ExpenseHistory.Action.DELETED)

    def _create_snapshot(self, request, obj, action):
        ExpenseHistory.objects.create(
            expense=obj,
            action=action,
            user=request.user,
            cost_type=obj.cost_type,
            category=obj.category,
            custom_category=obj.custom_category,
            amount=obj.amount,
            description=obj.description,
            expense_date=obj.expense_date
        )

@admin.register(ExpenseHistory)
class ExpenseHistoryAdmin(admin.ModelAdmin):
    list_display = ["id", "action", "expense", "user", "category", "custom_category", "amount", "created_at"]
    list_filter = ["action", "user", "cost_type", "category"]
    search_fields = ["expense__id", "custom_category", "user__phone_number"]
    readonly_fields = [f.name for f in ExpenseHistory._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
