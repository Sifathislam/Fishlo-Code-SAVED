from django.db import models
from django.contrib.auth import get_user_model
import django

User = get_user_model()

class CostType(models.TextChoices):
    VARIABLE = "VARIABLE", "Variable Cost"
    OPERATIONAL = "OPERATIONAL", "Operational Cost"

class ExpenseCategory(models.TextChoices):
    # Variable
    FISH_COST    = "FISH_COST", "COGS (Fish)"
    MASALA_COST  = "MASALA_COST", "COGS (Masala)"
    TRAVEL       = "TRAVEL", "Travel"
    ICE          = "ICE", "Ice"
    PACKAGING    = "PACKAGING", "Packaging Cost"
    CLEANING     = "CLEANING", "Store Cleaning"
    LABOUR       = "LABOUR", "Labour"
    OTHER        = "OTHER", "Other"
    # Operational
    RENT         = "RENT", "Store Rent"
    UTILITIES    = "UTILITIES", "Utilities (Electricity/Water)"
    STORE_MISC   = "STORE_MISC", "Store Misc (Repairs/Marketing)"
    SALARY       = "SALARY", "Salary"

class MonthlyExpenseManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

class MonthlyExpense(models.Model):
    storage_location = models.ForeignKey(
        "inventory.StorageLocation", on_delete=models.CASCADE, related_name="monthly_expenses"
    )
    expense_date = models.DateField(default=django.utils.timezone.now, help_text="Date of the expense")
    cost_type = models.CharField(max_length=20, choices=CostType.choices, default=CostType.VARIABLE)
    category = models.CharField(max_length=50, choices=ExpenseCategory.choices)
    custom_category = models.CharField(max_length=100, blank=True, help_text="Used when category is OTHER")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)

    objects = MonthlyExpenseManager()
    all_objects = models.Manager()

    class Meta:
        indexes = [
            models.Index(fields=["storage_location", "-expense_date"]),
        ]
        ordering = ["-expense_date", "-created_at"]

    def __str__(self):
        return f"{self.get_category_display()} - {self.expense_date} - {self.storage_location.name}"

class ExpenseHistory(models.Model):
    class Action(models.TextChoices):
        CREATED = "CREATED", "Created"
        UPDATED = "UPDATED", "Updated"
        DELETED = "DELETED", "Deleted"

    expense = models.ForeignKey(MonthlyExpense, on_delete=models.CASCADE, related_name="history")
    action = models.CharField(max_length=20, choices=Action.choices)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    cost_type = models.CharField(max_length=20)
    category = models.CharField(max_length=50)
    custom_category = models.CharField(max_length=100, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=500, blank=True)
    expense_date = models.DateField(default=django.utils.timezone.now)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["expense", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.expense.get_category_display()} - {self.action} at {self.created_at}"
