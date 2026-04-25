from rest_framework import serializers
from ..models.monthly_expense_models import MonthlyExpense

class MonthlyExpenseSerializer(serializers.ModelSerializer):
    category_display = serializers.SerializerMethodField()

    cost_type_display = serializers.CharField(source='get_cost_type_display', read_only=True)

    class Meta:
        model = MonthlyExpense
        fields = [
            'id', 'storage_location', 'expense_date', 'cost_type', 'cost_type_display', 'category', 'custom_category',
            'category_display', 'amount', 'description', 
            'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ['id', 'storage_location', 'created_at', 'updated_at', 'created_by']

    def get_category_display(self, obj):
        if obj.category == 'OTHER' and obj.custom_category:
            return obj.custom_category
        return obj.get_category_display()



    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value
