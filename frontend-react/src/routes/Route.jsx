import { Route, Routes, useLocation, Outlet } from "react-router-dom";
import HomePage from "../pages/HomePage";
import ReactGA from "react-ga4";

import React, { useEffect, useState, Suspense, lazy } from "react";
import "react-loading-skeleton/dist/skeleton.css";
import AddressBook from "../components/dashboard/AddressBook";
import Dashboard from "../components/dashboard/Dashboard";
import Orders from "../components/dashboard/Orders";
import OrderTracking from "../components/dashboard/OrderTracking";
import ProfileSettings from "../components/dashboard/ProfileSetting";
import TransactionHistory from "../components/dashboard/TransactionsHistory";
import CartSidebar from "../components/homepage/CartSidebar";
import AIFisherPage from "../components/policyLayouts/AIFisherPage";
import BargainingPage from "../components/policyLayouts/BargainingPage";
import DeliveryInfoPage from "../components/policyLayouts/DeliveryInfoPage";
import HelpPage from "../components/policyLayouts/HelpPage";
import PolicyLayout from "../components/policyLayouts/PolicyLayout";
import PrivacyPage from "../components/policyLayouts/PrivacyPage";
import QualityPromisePage from "../components/policyLayouts/QualityPromisePage";
import RefundPage from "../components/policyLayouts/RefundPage";
import TermsPage from "../components/policyLayouts/TermsPage";
import WhyPricesPage from "../components/policyLayouts/WhyPricesPage";
import Footer from "../shared/components/Footer";
import Navbar from "../shared/components/Navbar";
import SplashScreen from "../shared/components/SplashScreen";
const StoreAnalytics = lazy(() => import("../components/storeDashboard/StoreAnalytics"));
const StoreDelivery = lazy(() => import("../components/storeDashboard/StoreDelivery"));
const StoreHistory = lazy(() => import("../components/storeDashboard/StoreHistory"));
const StoreInventory = lazy(() => import("../components/storeDashboard/StoreInventory"));
const StoreLayout = lazy(() => import("../components/storeDashboard/StoreLayout"));
const StoreLogin = lazy(() => import("../components/storeDashboard/StoreLogin"));
const StoreManualOrder = lazy(() => import("../components/storeDashboard/StoreManualOrder"));
const StoreCustomOrder = lazy(() => import("../components/storeDashboard/StoreCustomOrder"));
const StoreOrders = lazy(() => import("../components/storeDashboard/StoreOrders"));
const StoreOverview = lazy(() => import("../components/storeDashboard/StoreOverview"));
const StorePriceHistory = lazy(() => import("../components/storeDashboard/StorePriceHistory"));
const StorePricing = lazy(() => import("../components/storeDashboard/StorePricing"));
const StorePricingLayout = lazy(() => import("../components/storeDashboard/StorePricingLayout"));
const StoreReports = lazy(() => import("../components/storeDashboard/StoreReports"));
const StorePnL = lazy(() => import("../components/storeDashboard/StorePnL"));
const StoreStaff = lazy(() => import("../components/storeDashboard/StoreStaff"));
const StoreStockLayout = lazy(() => import("../components/storeDashboard/StoreStockLayout"));
const StoreOrdersBySlots = lazy(() => import("../components/storeDashboard/StoreOrdersBySlots"));
import { useSearchProducts } from "../features/useSearchProducts";
import useDebouncedValue from "../shared/hooks/useDebounce";
import useStateHooks from "../shared/hooks/useStateHooks";
import AppPromo from "../pages/AppPromo";
import CategoryPage from "../pages/CategoryPage";
import CheckoutPage from "../pages/CheckoutPage";
import DashboardLayout from "../pages/DashboardLayout";
import DetailsPage from "../pages/Details";
import OrderFailure from "../pages/OrderFailure";
import OrderSuccess from "../pages/OrderSuccess";
import SearchPage from "../pages/SearchPage";
import SubCategoryPage from "../pages/SubCategoryPage";
import AllProductsPage from "../pages/AllProductsPage";
import B2BFrozenSeafood from "../pages/B2BFrozenSeafood";
import HowItWorksPage from "../pages/HowItWorksPage";
import "../styles/card.css";
import "../styles/dashboard.css";
import "../styles/loader.css";
import "../styles/login.css";
import "../styles/navbar.css";
import "../styles/searchpage.css";
import AuthGuard from "./AuthGuard";

// Lazy-loaded Delivery components
const DeliveryLayout = lazy(() => import("../components/delivery/DeliveryLayout"));
const DeliveryLogin = lazy(() => import("../components/delivery/DeliveryLogin"));
const DeliveryDashboard = lazy(() => import("../components/delivery/DeliveryDashboard"));
const DeliveryOrders = lazy(() => import("../components/delivery/DeliveryOrders"));
const DeliveryOrderDetail = lazy(() => import("../components/delivery/DeliveryOrderDetail"));
const DeliveryHistory = lazy(() => import("../components/delivery/DeliveryHistory"));
const DeliveryProfile = lazy(() => import("../components/delivery/DeliveryProfile"));
const DeliveryWithdrawal = lazy(() => import("../components/delivery/DeliveryWithdrawal"));
const DeliveryChangePassword = lazy(() => import("../components/delivery/DeliveryChangePassword"));

export default function Routing() {
  // ... existing hooks ...
  const { cartOpen, setCartOpen } = useStateHooks();
  const [search, setSearch] = useState("");
  const debounceValue = useDebouncedValue(search, 400);
  const { pathname, search: queryString } = useLocation();
  const isStorePath = pathname.startsWith("/store");
  const isDeliveryPath = pathname.startsWith("/delivery");
  const isDashboardPath = pathname.startsWith("/dashboard");
  const {
    data,
    isLoading: isProductsLoading,
    isError: isProductsError,
    error: productsError,
  } = useSearchProducts(debounceValue);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Track page views automatically on route change (excluding store admin dashboard for cleaner metrics)
    if (!isStorePath && !isDashboardPath && !isDeliveryPath) {
      ReactGA.send({ hitType: "pageview", page: pathname + queryString });
    }
  }, [pathname, queryString, isStorePath, isDashboardPath, isDeliveryPath]);

  // Dynamically inject PWA manifest only for Delivery routes
  useEffect(() => {
    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (isDeliveryPath) {
      if (!manifestLink) {
        manifestLink = document.createElement("link");
        manifestLink.rel = "manifest";
        manifestLink.href = "/manifest.webmanifest";
        document.head.appendChild(manifestLink);
      }
    } else {
      if (manifestLink) {
        manifestLink.remove();
      }
    }
  }, [isDeliveryPath]);

  return (
    <>
      {!isStorePath && <SplashScreen />}
      {(!isStorePath && !isDeliveryPath) && (
        <>
          <Navbar
            variant={"normal"}
            search={search}
            setSearch={setSearch}
            data={data}
          />
          <CartSidebar cartOpen={cartOpen} setCartOpen={setCartOpen} />
        </>
      )}
      <Routes>
        <Route element={<AuthGuard requireAuth={false} excludeRoles={["STORE_MANAGER", "DELIVERY_PARTNER"]} />}>
          <Route element={<HomePage />} path="/" exact />
          <Route element={<AllProductsPage />} path="/all-products" />
          <Route element={<AppPromo />} path="/app" />
          <Route element={<HowItWorksPage />} path="/how-it-works" />
          <Route element={<DetailsPage />} path="/:slug" />
          <Route
            element={
              <SearchPage
                debounceValue={debounceValue}
                setSearch={setSearch}
                data={data}
                isProductsLoading={isProductsLoading}
              />
            }
            path="/search"
          />
          <Route element={<B2BFrozenSeafood />} path="/frozen" />
          <Route element={<CategoryPage />} path="/categories" />
          <Route element={<PolicyLayout />}>
            <Route index path="/terms-and-conditions" element={<TermsPage />} />
            <Route path="/privacy-policy" element={<PrivacyPage />} />
            <Route path="/cancellation-refund" element={<RefundPage />} />
            <Route path="/how-fishlo-works" element={<WhyPricesPage />} />
            <Route path="/quality-promise" element={<QualityPromisePage />} />
            <Route path="/how-bargaining-works" element={<BargainingPage />} />
            <Route path="/meet-ai-fisherwoman" element={<AIFisherPage />} />
            <Route path="/delivery-information" element={<DeliveryInfoPage />} />
            <Route path="/help" element={<HelpPage />} />
          </Route>

          <Route element={<SubCategoryPage />} path="/categories/:slug" />
        </Route>
        <Route element={<AuthGuard allowedRoles={["CUSTOMER"]} excludeRoles={["STORE_MANAGER", "DELIVERY_PARTNER"]} loginPath="/" />}>
          <Route element={<CheckoutPage />} path="/checkout" />
          <Route element={<DashboardLayout />} path="/dashboard">
            <Route element={<Dashboard />} index />
            <Route element={<Orders />} path="orders" />
            <Route
              element={<OrderTracking />}
              path="orders/tracking/:orderId"
            />
            <Route element={<AddressBook />} path="address" />
            <Route element={<TransactionHistory />} path="transactions" />
            <Route element={<ProfileSettings />} path="profile" />
          </Route>
          <Route element={<OrderSuccess />} path="order/success" />
          <Route element={<OrderFailure />} path="order/failure" />
        </Route>

        {/* Store Application (Lazy Loaded) */}
        <Route
          path="/store"
          element={
            <Suspense fallback={<div className="delivery-loader-overlay"><div className="loader"></div></div>}>
              <Outlet />
            </Suspense>
          }
        >
          <Route element={<StoreLogin />} path="login" />

          {/* Protected Store Routes */}
          <Route element={<AuthGuard allowedRoles={["STORE_MANAGER"]} loginPath="/store/login" />}>
            <Route element={<StoreLayout />}>
              <Route index element={<StoreOverview />} />
              <Route path="orders" element={<StoreOrders />} />
              <Route path="orders-by-slots" element={<StoreOrdersBySlots />} />
              <Route path="reports" element={<StoreReports />} />
              <Route path="analytics" element={<StoreAnalytics />} />
              <Route path="profit-loss" element={<StorePnL />} />
              <Route path="inventory" element={<StoreStockLayout cache={false} />}>
                <Route index element={<StoreInventory />} />
                <Route path="history" element={<StoreHistory />} />
              </Route>
              <Route path="pricing" element={<StorePricingLayout />}>
                <Route index element={<StorePricing />} />
                <Route path="history" element={<StorePriceHistory />} />
              </Route>
              <Route path="staff" element={<StoreStaff />} />
              <Route path="delivery" element={<StoreDelivery />} />
              <Route path="manual-order" element={<StoreManualOrder />} />
              <Route path="custom-order" element={<StoreCustomOrder />} />
            </Route>
          </Route>
        </Route>

        {/* Delivery Partner Application (Lazy Loaded) */}
        <Route
          path="/delivery"
          element={
            <Suspense fallback={<div className="delivery-loader-overlay"><div className="loader"></div></div>}>
              <Outlet />
            </Suspense>
          }
        >
          <Route path="login" element={<DeliveryLogin />} />
          <Route element={<AuthGuard allowedRoles={["DELIVERY_PARTNER"]} loginPath="/delivery/login" />}>
            <Route element={<DeliveryLayout />}>
              <Route index element={<DeliveryDashboard />} />
              <Route path="orders" element={<DeliveryOrders />} />
              <Route path="orders/:id" element={<DeliveryOrderDetail />} />
              <Route path="history" element={<DeliveryHistory />} />
              <Route path="profile" element={<DeliveryProfile />} />
              <Route path="change-password" element={<DeliveryChangePassword />} />
              <Route path="withdraw" element={<DeliveryWithdrawal />} />
            </Route>
          </Route>
        </Route>
      </Routes>
      {(!isStorePath && !isDeliveryPath) && <Footer />}
    </>
  );
}
