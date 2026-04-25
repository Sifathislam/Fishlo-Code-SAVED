from .auth_views import SendOTPView, VerifyOTPView, LogoutView
from .profile_views import UserProfileView
from .address_views import (
    AddressListCreateView,
    AddressDetailView,
    MergeAddressView,
    SetDefaultAddressView,
)
from .dashboard_views import UserDashboardAPIView
from .orders_views import MyOrdersAPIView
from .settings_views import AccountSettingsAPIView
from .transactions_views import UserTransactionListAPIView
from .store_auth_views import StoreLoginView


__all__ = [
    "SendOTPView",
    "VerifyOTPView",
    "LogoutView",
    "UserProfileView",
    "AddressListCreateView",
    "AddressDetailView",
    "MergeAddressView",
    "SetDefaultAddressView",
    "UserDashboardAPIView",
    "MyOrdersAPIView",
    "AccountSettingsAPIView",
    "UserTransactionListAPIView",
    "StoreLoginView",
]
