from rest_framework.permissions import BasePermission
from .models.manager_models import StoreManagerProfile


class IsStoreManagerStaff(BasePermission):
    message = "You don't have permission to access this."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            self.message = "Authentication required."
            return False

        # Must have store manager profile
        if not StoreManagerProfile.objects.filter(user=user).exists():
            self.message = "This account doesn't have permission to access this."
            return False

        return True
