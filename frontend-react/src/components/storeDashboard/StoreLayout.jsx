import { useState, useEffect, Suspense } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useGetStoreManagerInfo } from "../../features/useGetProfile";
import { useLogout } from "../../features/useLogout";
import useAuth from "../../hooks/useAuth";
import { useNewOrderNotification } from "../../hooks/useNewOrderNotification";
import "../../styles/storeDashboard.css";
import GlobalReceiptPrinter from "./manualOrder/GlobalReceiptPrinter";
import QZSettingsModal from "./shared/QZSettingsModal";

export default function StoreLayout() {
  document.title = "Store Dashboard - Fishlo";

  // Poll for new orders & play sound across all store dashboard pages
  useNewOrderNotification();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const { data: storeInfo, isLoading: isStoreInfoLoading } = useGetStoreManagerInfo();

  const { mutate: logout } = useLogout();

  const handleLogout = (e) => {
    e.preventDefault();
    logout({ redirectTo: "/store/login" });
  };

  const isActive = (path) => {
    if (path === "/store" && location.pathname === "/store") return true;
    if (path !== "/store") {
      return location.pathname === path || location.pathname.startsWith(path + "/");
    }
    return false;
  };

  return (
    <div className="storeDashboard">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="sd-mobile-backdrop d-lg-none"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Top Bar */}
      <div
        className="d-lg-none bg-white border-bottom p-3 d-flex align-items-center justify-content-between sticky-top shadow-sm"
        style={{ zIndex: 1020 }}
      >
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-light border p-2 rounded-3 d-flex align-items-center justify-content-center"
            style={{ width: "40px", height: "40px" }}
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <i className="bi bi-list fs-4 text-dark"></i>
          </button>
          <span className="fw-medium text-dark fs-5">Store Dashboard</span>
        </div>
        <img src="/fishlo-logo.svg" alt="Logo" style={{ height: "24px" }} />
      </div>

      {/* Sidebar */}
      <aside className={`sd-sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="sd-brand-logo justify-content-between">
          <img
            className="brand-img"
            src="/fishlo-logo.svg"
            alt="Fishlo logo"
            style={{ cursor: "pointer" }}
          />
          <button
            className="btn btn-link link-light text-white p-0 d-lg-none"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <i className="bi bi-x-lg" style={{ fontSize: "1.5rem" }} />
          </button>
        </div>
        <nav className="flex-grow-1">
          <Link
            to="/store"
            className={`sd-nav-link ${isActive("/store") ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <i className="bi bi-grid-fill"></i> Dashboard
          </Link>
          <Link
            to="/store/orders"
            className={`sd-nav-link ${isActive("/store/orders") ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <i className="bi bi-basket-fill"></i> Orders
          </Link>
          <Link
            to="/store/orders-by-slots"
            className={`sd-nav-link ${isActive("/store/orders-by-slots") ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <i className="bi bi-clock-history"></i> Orders by Slots
          </Link>
          <Link
            to="/store/manual-order"
            className={`sd-nav-link ${isActive("/store/manual-order") ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <i className="bi bi-plus-square-fill"></i> Manual Order
          </Link>
          <Link
            to="/store/custom-order"
            className={`sd-nav-link ${isActive("/store/custom-order") ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <i className="bi bi-pencil-square"></i> Custom Order
          </Link>
          <Link
            to="/store/reports"
            className={`sd-nav-link ${isActive("/store/reports") ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <i className="bi bi-bar-chart-fill"></i> Reports
          </Link>
          <Link
            to="/store/analytics"
            className={`sd-nav-link ${isActive("/store/analytics") ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <i className="bi bi-graph-up-arrow"></i> Analytics
          </Link>
          <Link
            to="/store/profit-loss"
            className={`sd-nav-link ${isActive("/store/profit-loss") ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <i className="bi bi-wallet2"></i> Profit & Loss
          </Link>
          <Link
            to="/store/pricing"
            className={`sd-nav-link ${isActive("/store/pricing") ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <i className="bi bi-currency-rupee"></i> Pricing
          </Link>
          <Link
            to="/store/inventory"
            className={`sd-nav-link ${isActive("/store/inventory") ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <i className="bi bi-box-seam-fill"></i> Inventory
          </Link>

          <Link
            to="/store/delivery"
            className={`sd-nav-link ${isActive("/store/delivery") ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <i className="bi bi-bicycle"></i> Delivery
          </Link>
          <Link
            to="/store/staff"
            className={`sd-nav-link ${isActive("/store/staff") ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <i className="bi bi-people-fill"></i> Staff
          </Link>
          <button
            onClick={() => setShowPrinterSettings(true)}
            className="sd-nav-link border-0 bg-transparent w-100 text-start"
          >
            <i className="bi bi-printer-fill"></i> Printer Settings
          </button>
        </nav>

        {/* Sidebar Footer: Profile & Logout */}
        <div className="sd-sidebar-footer">
          <div className="sd-profile-card">
            {isStoreInfoLoading ? (
              <Skeleton circle width={40} height={40} className="sd-profile-img" />
            ) : (
              <div
                className="sd-profile-img d-flex align-items-center justify-content-center text-white fw-medium"
                style={{ background: "#d7574c", flexShrink: 0 }}
              >
                {storeInfo?.data?.first_name?.[0]?.toUpperCase() || "S"}
                {storeInfo?.data?.last_name?.[0]?.toUpperCase() || "M"}
              </div>
            )}
            <div className="lh-1 w-100 overflow-hidden">
              {isStoreInfoLoading ? (
                <>
                  <Skeleton width={100} height={15} />
                  <Skeleton width={80} height={10} className="mt-1" />
                </>
              ) : (
                <>
                  <div className="fw-medium text-dark small">
                    {storeInfo?.data?.first_name || "Store"} {storeInfo?.data?.last_name || "Manager"}
                  </div>
                  <div className="text-muted small " style={{ fontSize: "0.75rem" }}>
                    {storeInfo?.data?.storage_location_name || "No Hub Assigned"}
                  </div>
                </>
              )}
            </div>
          </div>
          <a
            href="/"
            className="sd-nav-link text-danger mt-2"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right"></i> Logout
          </a>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <main className="sd-main-wrapper" style={{ position: "relative" }}>
        <Suspense fallback={
          <div className="d-flex justify-content-center align-items-center w-100" style={{ minHeight: "60vh" }}>
            <div className="spinner-border text-danger" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        }>
          <Outlet context={{ isMobileMenuOpen, setIsMobileMenuOpen }} />
        </Suspense>
      </main>
      <GlobalReceiptPrinter />
      <QZSettingsModal show={showPrinterSettings} onClose={() => setShowPrinterSettings(false)} />
    </div>
  );
}
