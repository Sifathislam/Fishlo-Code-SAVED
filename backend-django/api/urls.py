# Packages Imports
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

# Local Imports
from accounts import views as UserViews
from home.views import BannerListAPIView, SubscribeAPIView
from orders import views as OrderViews
from products import views as ProductViews
from promotions import views as PromotionView
from policies.views import PolicyDetailView, FAQListAPIView
from .views import health
from delivery import views as DeliveryView
from orders.views import cart_views as CartViews
from orders.views import order_views as OrderViews
from orders.views import discount_views as DiscountViews
from payments.views import order_payment_views as OrderPaymentViews
from orders.views import store_views as StoreView
from store_management.views import manual_order as ManualOrderView
from store_management.views.online_receipt_views import OnlineOrderReceiptView
from store_management.views import price_history_views as PriceHistoryViews
from store_management.views import price_matrix_views as PriceMatrixView
from store_management.views import product_views as StoreProductViews
from store_management.views import inventory_views as StoreInventoryViews
from store_management.views import store_person_views as StoreManagerInfoViews
from store_management.views import customer_search_views as CustomerSearchViews
from delivery.views import store_delivery_views as StoreDeliveryViews
from store_management.views import qz_views as QZViews
from bargains.views import ActiveChatSessionView, ChatSessionCreateView, ChatMessageCreateView, EndChatSessionView
from delivery.views import delivery_slots as DeliverySlotsView
from notifications import views as NotificationViews
from home.views.home_views import HomePageAPIView
from delivery.views import delivery_man_views as DeliveryManViews
from delivery.views import assignment_views as DeliveryAssignmentViews
from delivery.views import withdrawal_views as WithdrawalViews
from orders.views import analytics_views as AnalyticsViews
from orders.views import bi_views as BiViews
from store_management.views import staff_views as StaffViews
from store_management.views import monthly_expense_views as ExpenseViews
from store_management.views import pnl_views as PnLViews

urlpatterns = [  
    path("health/", health),  
    path("banners/", BannerListAPIView.as_view(), name="banner-list"),
    path("subscribe/", SubscribeAPIView.as_view(), name="subscribe"),
    path("promotion-banners/", PromotionView.BannerAPIView.as_view(), name="banner"),
    path("home-qs-mobile/", HomePageAPIView.as_view(), name="home-page"),
    # Accounts Views
    path("send-otp/", UserViews.SendOTPView.as_view(), name="send_otp"),
    path("verify-otp/", UserViews.VerifyOTPView.as_view(), name="verify_otp"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path('logout/',  UserViews.LogoutView.as_view(), name='logout'),
    path('store/login/', UserViews.StoreLoginView.as_view(), name='store_login'),
    path('delivery/login/', UserViews.StoreLoginView.as_view(), name='delivery_login'),
    # UserProfile Views
    path("profile/", UserViews.UserProfileView.as_view(), name="user-profile"),
    path("account/settings/",UserViews.AccountSettingsAPIView.as_view(),name="account-settings",),
    path("addresses/",UserViews.AddressListCreateView.as_view(),name="address-list-create",),
    path("addresses/<int:address_id>/",UserViews.AddressDetailView.as_view(),name="address-detail",),
    path("addresses/<int:address_id>/set-default/",UserViews.SetDefaultAddressView.as_view(),name="set-default-address",),
    path("addresses/merge/", UserViews.MergeAddressView.as_view(), name="merge-addresses"),
    path("dashboard-summary/",UserViews.UserDashboardAPIView.as_view(),name="dashboard-summary",),
    path("my-orders/", UserViews.MyOrdersAPIView.as_view(), name="my-orders-list"),
    path("payments/history/",UserViews.UserTransactionListAPIView.as_view(),name="my-transaction",),
    # Product Views
    path("products/all/", ProductViews.ProductListView.as_view(), name="product-list"),
    path("products/most-loved/",ProductViews.MostLovedProductListView.as_view(),name="product-most-loved",),
    path("products/<slug:slug>/",ProductViews.ProductDetailView.as_view(),name="product-detail",),
    path("products/<slug:slug>/related/",ProductViews.RelatedProductsView.as_view(),name="related-products",),
    path("search-products/",ProductViews.ProductSearchAPIView.as_view(),name="api-search-products",),
    path("products/what-you-get/<int:product_id>/",ProductViews.WhatYouGetAPIView.as_view(),name="what_you_get_api",),
    path("products/source/<int:product_id>/",ProductViews.SourceAPIView.as_view(),name="source_api",),
    path("stock-notify/",ProductViews.StockNotifyRequestCreateView.as_view(),name="stock-notify-create",),
    path("recently-viewed/",ProductViews.RecentlyViewedListView.as_view(),name="recently-viewed-list",),
    path("get-delivery-time/",ProductViews.GetDeliveryTime.as_view(),name="get-delivery-time",),
    # Review Views
    path("products/reviews/<slug:slug>/",ProductViews.ProductReviewListView.as_view(),name="product-reviews",),
    path("products/reviews/create/<slug:slug>/",ProductViews.CreateReviewView.as_view(),name="create-review",),
    
    # Category Views
    path("categories/", ProductViews.CategoryListView.as_view(), name="category-list"),


    # Cart Views
    path("cart/", CartViews.CartDetailView.as_view(), name="cart_detail"),
    path("cart/add/", CartViews.AddToCartView.as_view(), name="add_to_cart"),
    path("cart/clear/", CartViews.ClearCartView.as_view(), name="clear_cart"),
    # Cart item Views
    path("cart/item/update/<int:item_id>/",CartViews.UpdateCartItemView.as_view(),name="update_cart_item",),
    path("cart/item/increase/<int:item_id>/",CartViews.IncreaseCartItemView.as_view(),name="increase_cart_item",),
    path("cart/item/decrease/<int:item_id>/",CartViews.DecreaseCartItemView.as_view(),name="decrease_cart_item",),
    path("cart/item/remove/<int:item_id>/",CartViews.RemoveCartItemView.as_view(),name="remove_cart_item",),
    path("cart/merge/", CartViews.MergeCartView.as_view(), name="merge_cart"),

    # Order Views
    path("orders/create/", OrderViews.CreateOrderView.as_view(), name="create_order"),
    path('orders/reconcile/', OrderViews.ReconcileUserOrdersView.as_view(), name='reconcile-orders'),
    path("orders/details/<str:order_number>/",OrderViews.OrderDetailView.as_view(),name="order-detail",),
    path("orders/tracking/<str:order_number>/",OrderViews.OrderTrackingView.as_view(),name="order-tracking",),
    path('orders/cancel-order/', OrderViews.CancelOrderView.as_view(), name='cancel-order'),
    path('orders/cancel-order-with-refund/', OrderViews.CancelOrderWithRefundView.as_view(), name='cancel-order-with-refund'),
    path("orders/invoice/download/<str:order_number>/",OrderViews.DownloadOrderInvoiceAPIView.as_view(),),
    path("orders/invoice/preview/<str:order_number>/",OrderViews.PreviewOrderInvoiceAPIView.as_view(),),

    #Discount Views
    path("orders/validate-discount/",DiscountViews.ValidateDiscountView.as_view(),name="validate-discount",),
    path("orders/available-discount-coupons/",DiscountViews.AvailableDiscountsView.as_view(),name="validate-discount",),

    # Payment Views
    path('orders/check-payment/<str:order_number>/', OrderPaymentViews.ManualPaymentCheckView.as_view(), name='manual-payment-check'),
    path("orders/payment-status/<int:order_id>/",OrderPaymentViews.CheckPaymentStatusView.as_view(),name="payment-status",),
    path("orders/verify-payment/",OrderPaymentViews.VerifyPaymentView.as_view(),name="verify-payment",),
    
    # Delivery Related views 
    path("delivery-slots-list/",DeliverySlotsView.DeliverySlotsAPIView.as_view(),name="delivery_slots_list",),
    
    
    # Other api 
    path('policy/<slug:slug>/', PolicyDetailView.as_view(), name='policy-detail'),
    path('faqs/', FAQListAPIView.as_view(), name='faq-list'),
    path('delivery-zones/', DeliveryView.DeliveryZoneListView.as_view(), name='delivery-zone-list'),

     # Store Views
    path("store-manager/info/", StoreManagerInfoViews.StoreManagerMeView.as_view(), name="store-manager-info"),
    path("store/overview/", StoreView.StoreOverviewView.as_view(), name="store-overview"),
    path("store/orders/", StoreView.StoreOrderListView.as_view(), name="store-orders"),
    path("store/orders-by-slots/", StoreView.StoreOrdersBySlotView.as_view(), name="store-orders-by-slots"),
    path("store/orders/<str:order_number>/status/", StoreView.StoreOrderUpdateView.as_view(), name="store-order-status"),
    path("store/orders/<str:order_number>/payment-method/", StoreView.StoreOrderPaymentMethodUpdateView.as_view(), name="store-order-payment-method"),
    path("store/new-order-check/", StoreView.StoreNewOrderCheckView.as_view(), name="store-new-order-check"),
    path("store/create-manual-order/", ManualOrderView.CreateManualOrderView.as_view(), name="create-manual-order"),
    path("store/manual-order-product-list/", ManualOrderView.ManualProductListView.as_view(), name="manual-order-product-list"),
    path("store/manual-order/receipt/<str:order_number>/", ManualOrderView.ManualOrderReceiptView.as_view()),
    path("store/online-receipt/<str:order_number>/", OnlineOrderReceiptView.as_view()),
    path("store/pricing/", PriceMatrixView.PriceMatrixListCreateAPIView.as_view(), name="pricing-list-create"),
    path("store/pricing-update/<int:pk>/", PriceMatrixView.PriceMatrixUpdateAPIView.as_view(), name="pricing-update"),
    path("store/pricing/history/", PriceHistoryViews.PriceHistoryListAPIView.as_view(), name="pricing-history"),
    path("store/pricing/history/export/", PriceHistoryViews.PriceHistoryExportAPIView.as_view(), name="pricing-export"),
    path("store/products/simple/", StoreProductViews.ProductSimpleListView.as_view(), name="product-simple-list"),
    path("store/inventory/", StoreInventoryViews.InventoryListCreateAPIView.as_view(), name="inventory-list-create"),
    path("store/inventory/<int:pk>/", StoreInventoryViews.InventoryRetrieveUpdateAPIView.as_view(), name="inventory-detail-update"),
    path("store/inventory/history/", StoreInventoryViews.InventoryHistoryListAPIView.as_view(), name="inventory-history"),
    path("store/qz-sign/", QZViews.QZSignView.as_view(), name="qz-sign"),
    path("store/delivery-man/assign/", DeliveryAssignmentViews.AssignOrdersView.as_view(), name="assign-orders"),
    path("store/delivery-partners/", StoreDeliveryViews.StoreDeliveryPartnerListCreateView.as_view(), name="store-delivery-partner-list-create"),
    path("store/delivery-partners/<int:pk>/", StoreDeliveryViews.StoreDeliveryPartnerDetailView.as_view(), name="store-delivery-partner-detail"),
    path("store/customer-search/", CustomerSearchViews.CustomerPhoneSearchView.as_view(), name="customer-phone-search"),

    # AI Chat Endpoint
    path("chat/sessions/", ChatSessionCreateView.as_view(), name="chat-session-create"),
    path("chat/messages/", ChatMessageCreateView.as_view(), name="chat-message-create"),
    path("chat/sessions/active/", ActiveChatSessionView.as_view()),
    path("chat/sessions/end/", EndChatSessionView.as_view()),

    # Notification Feature 
    
    # ── Device / FCM Token ─────────────────────────────────────

    # Call register after login, deregister on logout
    path('notification/devices/register/',NotificationViews.DeviceRegisterView.as_view(),name='device-register',),
    path('notification/devices/deregister/',NotificationViews.DeviceDeregisterView.as_view(),name='device-deregister',),
    # ── Notification Inbox ─────────────────────────────────────
    path('notification/',NotificationViews.NotificationListView.as_view(),name='notification-list',),
    path('notification/<int:notification_id>/',NotificationViews.NotificationDetailView.as_view(),name='notification-detail',),
    path('notification/mark-read/',NotificationViews.MarkNotificationsReadView.as_view(),name='mark-read',),
    path('notification/unread-count/',NotificationViews.UnreadCountView.as_view(),name='unread-count',),
    # ── User Preferences ───────────────────────────────────────
    path('notification/preferences/',NotificationViews.NotificationPreferenceView.as_view(),name='preferences',),
    # ── Campaigns (Admin only) ─────────────────────────────────
    path('notification/campaigns/',NotificationViews.CampaignListCreateView.as_view(),name='campaign-list',),
    path('notification/campaigns/<int:campaign_id>/send/',NotificationViews.CampaignSendView.as_view(),name='campaign-send',),
    path('notification/campaigns/<int:campaign_id>/logs/',NotificationViews.CampaignLogsView.as_view(),name='campaign-logs',),


    #Delivery APP APIs
    
    path('delivery-app/delivery_man/list/',DeliveryManViews.DeliveryManListView.as_view(),name='delivery-man-list',),
      # Admin

    # Delivery partner
    path("delivery-app/dashboard/", DeliveryView.DeliveryDashboardView.as_view(), name="delivery-dashboard"),
    path("delivery-app/assignments/details/<str:order_number>/", DeliveryAssignmentViews.AssignmentDetailView.as_view(), name="assignment-detail"),
    path("delivery-app/partner/status/", DeliveryView.PartnerStatusView.as_view(), name="partner-status"),
    path("delivery-app/partner/profile/", DeliveryView.DeliveryPartnerProfileView.as_view(), name="partner-profile"),
    path("delivery-app/partner/change-password/", DeliveryView.DeliveryPartnerChangePasswordView.as_view(), name="partner-change-password"),
    path("delivery-app/assignments/my/", DeliveryAssignmentViews.MyBatchesView.as_view(), name="my-assignments"),
    path("delivery-app/assignments/<str:action>/<int:batch_id>/", DeliveryAssignmentViews.BatchItemActionView.as_view(), name="batch-item-action"),
    path('delivery-app/order-delivery/send-otp/', DeliveryAssignmentViews.SendDeliveryOTPView.as_view(), name='verify-delivery-otp'),
    path('delivery-app/order-delivery/verify-otp/', DeliveryAssignmentViews.VerifyDeliveryOTPView.as_view(), name='verify-delivery-otp'),
    path("delivery-app/withdraw/request/", WithdrawalViews.RequestWithdrawalView.as_view(),name="withdrawal-request"),
    path("delivery-app/withdraw/history/", WithdrawalViews.WithdrawalHistoryView.as_view(),name="withdrawal-history"),


    # Analytics API 
    path("analytics/reports/summary/", AnalyticsViews.AnalyticsSummaryView.as_view(), name="analytics-summary"),
    path("analytics/reports/charts/", AnalyticsViews.AnalyticsChartsView.as_view(), name="analytics-charts"),
    path("analytics/reports/tables/", AnalyticsViews.AnalyticsTablesView.as_view(), name="analytics-tables"),
    path("analytics/reports/customers/", AnalyticsViews.AnalyticsCustomerInsightsView.as_view(), name="analytics-customers"),


    # BI 
    path("analytics/bi/summary/",   BiViews.BISummaryView.as_view(),   name="bi-summary"),
    path("analytics/bi/charts/",    BiViews.BIChartsView.as_view(),    name="bi-charts"),
    path("analytics/bi/customers/", BiViews.BICustomersView.as_view(), name="bi-customers"),
    path("analytics/bi/riders/",    BiViews.BIRidersView.as_view(),    name="bi-riders"),
    
    # Store Staff APIs
    path('staff_management/staff/choices/', StaffViews.StaffFormChoicesView.as_view(), name='staff-choices'),
    path('staff_management/staff/', StaffViews.StaffListCreateView.as_view(), name='staff-list-create'),
    path('staff_management/staff/<int:pk>/', StaffViews.StaffDetailView.as_view(), name='staff-detail'),
    path('staff_management/staff/<int:pk>/toggle-status/', StaffViews.StaffToggleStatusView.as_view(), name='staff-toggle-status'),

    # Monthly Expenses
    path("store/expenses/", ExpenseViews.MonthlyExpenseListCreateView.as_view(), name="expense-list-create"),
    path("store/expenses/<int:pk>/", ExpenseViews.MonthlyExpenseDetailView.as_view(), name="expense-detail"),

    # Profit & Loss
    path("analytics/pnl/summary/", PnLViews.PnLSummaryView.as_view(), name="pnl-summary"),
    path("analytics/pnl/charts/", PnLViews.PnLChartsView.as_view(), name="pnl-charts"),
]

