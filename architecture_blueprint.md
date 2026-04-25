## Proposed Folder Structure

```
src/
│
├── app/                          # ① APPLICATION SHELL
│   ├── App.jsx                   # Root component  
│   ├── main.jsx                  # Entry point (ReactDOM.createRoot)
│   ├── providers/                # All top-level React providers
│   │   ├── AppProviders.jsx      # Composes all providers together
│   │   ├── AuthProvider.jsx
│   │   ├── QueryProvider.jsx     # TanStack Query client setup
│   │   └── StateProvider.jsx
│   └── routes/                   # Route definitions only
│       ├── index.jsx             # Main router (createBrowserRouter)
│       ├── customerRoutes.jsx    # Customer-facing routes
│       ├── storeRoutes.jsx       # Store dashboard routes
│       ├── deliveryRoutes.jsx    # Delivery partner routes
│       └── guards/               # Route protection
│           ├── PrivateRoute.jsx
│           ├── StorePrivateRoute.jsx
│           └── StoreGuard.jsx
│
├── features/                     # ② FEATURE SLICES (the heart of FSD)
│   │
│   ├── auth/                     # Authentication & OTP
│   │   ├── components/
│   │   │   ├── LoginModal.jsx
│   │   │   ├── LoginFormRightSide.jsx
│   │   │   ├── OtpVerifyModal.jsx
│   │   │   └── OtpVerifyRightSideForm.jsx
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   └── index.js              # Barrel export
│   │
│   ├── cart/                     # Cart & Sidebar
│   │   ├── components/
│   │   │   └── CartSidebar.jsx
│   │   ├── hooks/
│   │   │   └── useProductActions.js
│   │   ├── queries/
│   │   │   └── useCart.js
│   │   └── index.js
│   │
│   ├── checkout/                 # Checkout flow
│   │   ├── components/
│   │   │   ├── CheckoutLeft.jsx
│   │   │   ├── CheckoutRight.jsx
│   │   │   ├── BillingAddress.jsx
│   │   │   ├── AddressCard.jsx
│   │   │   ├── AddressSelectionModal.jsx
│   │   │   ├── DeliverySlotSelection.jsx
│   │   │   ├── PaymentMethodSelection.jsx
│   │   │   ├── BargainProductCard.jsx
│   │   │   ├── Addons.jsx
│   │   │   ├── ChatBox.jsx
│   │   │   ├── CheckoutChatBox.jsx
│   │   │   └── skeletons/
│   │   │       ├── CartSectionSkeleton.jsx
│   │   │       └── CheckoutAddressSkeleton.jsx
│   │   ├── hooks/
│   │   │   └── useCheckout.js
│   │   ├── queries/
│   │   │   ├── useCreateOrder.js
│   │   │   ├── useCoupon.js
│   │   │   └── useDeliverySlots.js
│   │   └── index.js
│   │
│   ├── products/                 # Product browsing & details
│   │   ├── components/
│   │   │   ├── FeaturedCard.jsx
│   │   │   ├── FeaturedProductCard.jsx
│   │   │   ├── CollectionCard.jsx
│   │   │   ├── Category.jsx
│   │   │   ├── SubCategoryBar.jsx
│   │   │   ├── DeliveryInfo.jsx
│   │   │   └── skeletons/
│   │   │       ├── FeaturedProductCardSkeleton.jsx
│   │   │       └── CollectionSkeletonCard.jsx
│   │   ├── queries/
│   │   │   ├── useProduct.js
│   │   │   ├── useSingleProduct.js
│   │   │   ├── useGetCategory.js
│   │   │   ├── useGetMasala.js
│   │   │   ├── useProductMetaInfo.js
│   │   │   └── useStockNotify.js
│   │   └── index.js
│   │
│   ├── search/                   # Search functionality
│   │   ├── components/
│   │   │   └── SearchResults.jsx (from components/search/)
│   │   ├── queries/
│   │   │   └── useSearchProducts.js
│   │   ├── hooks/
│   │   │   └── useDebounce.js
│   │   └── index.js
│   │
│   ├── address/                  # Address management
│   │   ├── components/
│   │   │   ├── AddressModal.jsx
│   │   │   ├── LocationModal.jsx
│   │   │   └── LocationPicker.jsx
│   │   ├── hooks/
│   │   │   ├── useAddressBook.js
│   │   │   └── useLocationManager.js
│   │   ├── queries/
│   │   │   └── useAddress.js
│   │   └── index.js
│   │
│   ├── orders/                   # Customer order tracking
│   │   ├── components/
│   │   │   ├── Orders.jsx
│   │   │   ├── OrderTracking.jsx
│   │   │   └── CancelOrderModal.jsx
│   │   ├── hooks/
│   │   │   └── useOrderActions.js
│   │   ├── queries/
│   │   │   └── useGetOrder.js
│   │   └── index.js
│   │
│   ├── dashboard/                # Customer dashboard
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── AddressBook.jsx
│   │   │   ├── ProfileSetting.jsx
│   │   │   ├── TransactionsHistory.jsx
│   │   │   └── DashboardPagination.jsx
│   │   ├── queries/
│   │   │   ├── useGetDashboard.js
│   │   │   └── useGetProfile.js
│   │   └── index.js
│   │
│   ├── store/                    # ── STORE DASHBOARD ──
│   │   ├── overview/
│   │   │   ├── components/
│   │   │   │   └── StoreOverview.jsx
│   │   │   └── queries/
│   │   │       └── useStoreOverview.js
│   │   ├── orders/
│   │   │   ├── components/
│   │   │   │   ├── StoreOrders.jsx
│   │   │   │   └── StoreOrdersBySlots.jsx
│   │   │   ├── hooks/
│   │   │   │   └── useNewOrderNotification.js
│   │   │   └── queries/
│   │   │       └── useStoreOrders.js
│   │   ├── inventory/
│   │   │   ├── components/
│   │   │   │   ├── StoreInventory.jsx
│   │   │   │   └── StoreHistory.jsx
│   │   │   └── queries/
│   │   │       └── useStoreInventory.js
│   │   ├── pricing/
│   │   │   ├── components/
│   │   │   │   ├── StorePricing.jsx
│   │   │   │   └── StorePriceHistory.jsx
│   │   │   └── queries/
│   │   │       └── useStorePricing.js
│   │   ├── staff/
│   │   │   └── components/
│   │   │       └── StoreStaff.jsx
│   │   ├── delivery/
│   │   │   └── components/
│   │   │       └── StoreDelivery.jsx
│   │   ├── manual-order/
│   │   │   ├── components/
│   │   │   │   └── StoreManualOrder.jsx
│   │   │   ├── hooks/
│   │   │   │   └── useManualOrderLogic.js
│   │   │   └── queries/
│   │   │       ├── useCreateManualOrder.js
│   │   │       └── useManualOrderProducts.js
│   │   ├── analytics/
│   │   │   └── components/
│   │   │       ├── StoreAnalytics.jsx
│   │   │       └── StoreReports.jsx
│   │   ├── shared/               # Store-specific shared components
│   │   │   └── components/
│   │   │       ├── StoreLayout.jsx
│   │   │       ├── StoreLogin.jsx
│   │   │       ├── StoreStockLayout.jsx
│   │   │       └── StorePricingLayout.jsx
│   │   └── index.js
│   │
│   └── delivery/                 # ── DELIVERY PARTNER APP ──
│       ├── components/
│       │   ├── DeliveryLayout.jsx
│       │   ├── DeliveryLogin.jsx
│       │   ├── DeliveryDashboard.jsx
│       │   ├── DeliveryOrders.jsx
│       │   ├── DeliveryOrderDetail.jsx
│       │   └── DeliveryProfile.jsx
│       └── index.js
│
├── shared/                       # ③ SHARED / CROSS-CUTTING
│   ├── components/               # Reusable UI components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── Loader.jsx
│   │   ├── SplashScreen.jsx
│   │   └── TopAppBanner.jsx
│   ├── hooks/                    # Generic utility hooks
│   │   └── useAxios.js
│   ├── api/                      # Axios instance & interceptors
│   │   └── index.js
│   ├── utils/                    # Pure utility functions
│   │   ├── dateUtils.js
│   │   └── validation.js
│   └── constants/                # App-wide constants
│       └── deliveryZones.js
│
├── pages/                        # ④ PAGE COMPOSITIONS
│   ├── customer/                 # Customer-facing pages
│   │   ├── HomePage.jsx
│   │   ├── DetailsPage.jsx
│   │   ├── CategoryPage.jsx
│   │   ├── SubCategoryPage.jsx
│   │   ├── SearchPage.jsx
│   │   ├── CheckoutPage.jsx
│   │   ├── DashboardLayout.jsx
│   │   ├── OrderSuccess.jsx
│   │   ├── OrderFailure.jsx
│   │   └── AppPromo.jsx
│   └── policy/                   # Static/info pages
│       ├── PolicyLayout.jsx
│       ├── TermsPage.jsx
│       ├── PrivacyPage.jsx
│       ├── RefundPage.jsx
│       ├── HelpPage.jsx
│       ├── WhyPricesPage.jsx
│       ├── QualityPromisePage.jsx
│       ├── BargainingPage.jsx
│       ├── AIFisherPage.jsx
│       └── DeliveryInfoPage.jsx
│
├── styles/                       # ⑤ STYLES
│   ├── index.css                 # Global resets, CSS variables, typography
│   ├── App.css                   # Global layout + utility classes
│   └── modules/                  # Feature-scoped CSS
│       ├── card.css
│       ├── dashboard.css
│       ├── delivery.css
│       ├── login.css
│       ├── navbar.css
│       ├── searchpage.css
│       ├── storeDashboard.css
│       ├── termsPrivacy.css
│       ├── loader.css
│       ├── appPromo.css
│       └── paymentStatus.css
│
└── assets/                       # ⑥ STATIC ASSETS
    ├── images/
    ├── icons/
    └── fonts/
```

---
