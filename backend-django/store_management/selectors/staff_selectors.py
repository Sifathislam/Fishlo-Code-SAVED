from store_management.models import StoreManagerProfile


def get_all_staff(*, storage_location=None, role=None, status_filter=None, search=None):
    """Fetch and filter staff queryset"""
    queryset = StoreManagerProfile.objects.select_related('user').all()
    
    if storage_location:
        queryset = queryset.filter(storage_location=storage_location)

    if role:
        queryset = queryset.filter(role=role)
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    if search:
        queryset = (
            queryset.filter(first_name__icontains=search)
            | queryset.filter(last_name__icontains=search)
            | queryset.filter(user__email__icontains=search)
        )
    return queryset


def get_staff_summary(queryset):
    """Return summary stats for the dashboard cards"""
    return {
        "total_staff": queryset.count(),
        "active_now": queryset.filter(status="Active").count(),
        "on_leave": queryset.filter(status="On Leave").count(),
    }


def get_staff_by_id(pk):
    """Fetch single staff with user relation"""
    from django.shortcuts import get_object_or_404
    return get_object_or_404(
        StoreManagerProfile.objects.select_related('user'), pk=pk
    )
    

def get_role_choices():
    return [
        {"value": value, "label": label}
        for value, label in StoreManagerProfile.ROLE_CHOICES
    ]

def get_shift_choices():
    return [
        {"value": value, "label": label}
        for value, label in StoreManagerProfile.SHIFT_CHOICES
    ]

def get_status_choices():
    return [
        {"value": value, "label": label}
        for value, label in StoreManagerProfile.STATUS_CHOICES
    ]

def get_all_form_choices():
    return {
        "roles": get_role_choices(),
        "shifts": get_shift_choices(),
        "statuses": get_status_choices(),
    }