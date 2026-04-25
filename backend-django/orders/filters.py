import django_filters
from django.db.models import Q
from .models.orders_models import Order

class StoreOrderFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(method='filter_by_status')
    payment_status = django_filters.CharFilter(method='filter_payment_status')
    created_at_after = django_filters.DateFilter(method='filter_date_range')
    created_at_before = django_filters.DateFilter(method='filter_date_range')
    search = django_filters.CharFilter(method='filter_search')

    class Meta:
        model = Order
        fields = ['status', 'payment_status', 'created_at']

    def filter_payment_status(self, queryset, name, value):
        val = value.upper()
        if val == 'CASH':
            return queryset.filter(payment_method='CASH')
        if val == 'PAID':
            # 'Online' (PAID) should exclude Offline (CASH)
            return queryset.filter(payment_status='PAID').exclude(payment_method='CASH')
        return queryset.filter(payment_status__iexact=val)

    def filter_date_range(self, queryset, name, value):
        start_val = self.data.get('created_at_after')
        end_val = self.data.get('created_at_before')
        
        # Handle empty strings that might come from frontend
        if not start_val: start_val = None
        if not end_val: end_val = None

        if name == 'created_at_after':
            if start_val and not end_val:
                # User selected only Start Date -> Filter EXACTLY this date
                return queryset.filter(created_at__date=value)
            # Range mode or open-ended (fallback) -> Start Date onwards
            return queryset.filter(created_at__date__gte=value)

        if name == 'created_at_before':
            if end_val and not start_val:
                # User selected only End Date -> Filter EXACTLY this date
                return queryset.filter(created_at__date=value)
            # Range mode -> Upto End Date
            return queryset.filter(created_at__date__lte=value)
            
        return queryset

    def filter_by_status(self, queryset, name, value):
        status = value.upper()
        if status == 'PENDING':
            return queryset.filter(
                status__iexact=status
            ).filter(
                Q(payment_status__in=['PAID', 'PARTIALLY_PAID']) |
                Q(payment_method='COD', payment_status='PENDING')
            )
        elif status == 'CANCELLED':
            return queryset.filter(Q(status__iexact=status) | Q(payment_status='FAILED'))
        
        # For other statuses (CONFIRMED, PACKED, etc.), exclude FAILED payments
        return queryset.filter(status__iexact=status).exclude(payment_status='FAILED')

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(order_number__icontains=value) |
            Q(order_address__full_name__icontains=value) |
            Q(order_address__phone__icontains=value)
        )