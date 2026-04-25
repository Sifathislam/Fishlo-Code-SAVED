import { useLocation, useNavigate } from "react-router-dom";
import { useLogout } from "../../features/useLogout";

// Menu configuration
const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "fas fa-th-large",
    path: "/dashboard",
  },
  {
    id: "orders",
    label: "My Orders",
    icon: "fas fa-box-open",
    path: "/dashboard/orders",
  },
  {
    id: "addresses",
    label: "Addresses",
    icon: "far fa-address-book",
    path: "/dashboard/address",
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: "fas fa-receipt",
    path: "/dashboard/transactions",
  },
  {
    id: "profile",
    label: "Settings",
    icon: "fas fa-sliders-h",
    path: "/dashboard/profile",
  },
];

export default function DashboardSidebar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { mutate: logout, isPending: logoutPending } = useLogout();

  // Handle navigation
  const handleNavigate = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false); // close mobile menu
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isActive = (path) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard"; // exact match only
    }
    if (path === "/dashboard/orders") {
      return pathname.startsWith("/dashboard/orders");
    }
    return pathname.startsWith(path); // nested matches allowed
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="col-lg-3 sidebar-col">
        <title>My Dashboard | Fishlo</title>
        <div
          className="sidebar-card sticky-top"
          style={{ top: "120px", zIndex: "999" }}
        >
          <div className="nav flex-column nav-pills">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className={`nav-link ${isActive(item.path) ? "active" : ""}`}
                onClick={() => handleNavigate(item.path)}
              >
                <i className={item.icon}></i> {item.label}
              </div>
            ))}
          </div>
          <div
            className="list-group-item  text-danger"
            onClick={() => logout()}
            disabled={logoutPending}
          >
            <i className="fas fa-sign-out-alt"></i> Logout
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <>
          <div
            className="offcanvas offcanvas-start show"
            style={{ visibility: "visible" }}
            tabIndex="-1"
          >
            <div className="offcanvas-header">
              <h5 className="offcanvas-title fw-medium text-dark">Menu</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setIsMobileMenuOpen(false)}
              ></button>
            </div>

            <div className="offcanvas-body">
              <div className="nav flex-column nav-pills">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className={`nav-link ${
                      isActive(item.path) ? "active" : ""
                    }`}
                    onClick={() => handleNavigate(item.path)}
                  >
                    <i className={item.icon}></i> {item.label}
                  </div>
                ))}
              </div>

              <div
                class="list-group-item text-center text-danger"
                onClick={() => logout()}
                disabled={logoutPending}
              >
                <i class="fas fa-sign-out-alt"></i> Logout
              </div>
            </div>
          </div>

          <div
            className="offcanvas-backdrop fade show"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        </>
      )}
    </>
  );
}
