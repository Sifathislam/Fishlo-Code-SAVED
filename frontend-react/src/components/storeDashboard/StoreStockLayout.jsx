import { Link, Outlet, useLocation } from "react-router-dom";

export default function StoreStockLayout() {
  const location = useLocation();

  // Check if current path is exactly inventory or ends with inventory (for active state)
  const isInventory =
    location.pathname.endsWith("/store/inventory") ||
    location.pathname.endsWith("/store/inventory/");
  const isHistory = location.pathname.includes("/history");

  return (
    <div className="container-fluid p-0 fade-in">
      {/* Persistent Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="sd-header-title mb-1">Stock Management</h1>
          <p className="sd-header-subtitle mb-0">
            Track product availability and monitor history.
          </p>
        </div>
      </div>

      {/* Persistent Tabs */}
      <div className="d-flex mb-4 border-bottom px-2 gap-4 overflow-auto flex-nowrap">
        <Link
          to="/store/inventory"
          className={`text-decoration-none py-3 fw-medium position-relative ${!isHistory ? "text-danger" : "text-muted"}`}
          style={{ transition: "all 0.2s" }}
        >
          <i className="bi bi-box-seam me-2"></i> Inventory
          {!isHistory && (
            <div
              className="position-absolute bottom-0 start-0 w-100 bg-danger"
              style={{ height: "3px", borderRadius: "4px 4px 0 0" }}
            ></div>
          )}
        </Link>
        <Link
          to="/store/inventory/history"
          className={`text-decoration-none py-3 fw-medium position-relative ${isHistory ? "text-danger" : "text-muted"}`}
          style={{ transition: "all 0.2s" }}
        >
          <i className="bi bi-clock-history me-2"></i> All History
          {isHistory && (
            <div
              className="position-absolute bottom-0 start-0 w-100 bg-danger"
              style={{ height: "3px", borderRadius: "4px 4px 0 0" }}
            ></div>
          )}
        </Link>
      </div>

      {/* Dynamic Content Area */}
      <Outlet />
    </div>
  );
}
