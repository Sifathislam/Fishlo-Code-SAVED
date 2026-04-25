import { Search, ShoppingBasket } from "lucide-react";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useLocation, useNavigate } from "react-router-dom";
import { useGetCart } from "../../features/useCart";
import { useGetReconcile } from "../../features/useGetOrder";
import { useGetProfile } from "../../features/useGetProfile";
import { useLogout } from "../../features/useLogout";
import useAuth from "../../hooks/useAuth";
import { useLocationManager } from "../../hooks/useLocationManager";
import useStateHooks from "../hooks/useStateHooks";
import LocationModal from "../../components/LocationModal";
import LoginModal from "../../components/LoginModal";
import TopAppBanner from "./TopAppBanner";
import PhoneLogin from "../../components/phone/PhoneLogin";
import PopularSearches from "../../components/search/PopularSearches";

export default function Navbar({ search, setSearch, data: productsData }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { openLogin, setOpenLogin, setCartOpen } = useStateHooks();
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, setAuth } = useAuth();
  const { data: cart, isLoading } = useGetCart();
  const { data: profileData, isLoading: isProfileLoading } = useGetProfile();
  const { data: reconcile } = useGetReconcile();
  const { mutate: logout, isPending: logoutPending } = useLogout();
  const {
    selectedAddress,
    showLocationModal,
    setShowLocationModal,
    isLoadingAddress,
    mapCenter,
    handleLocationConfirm,
  } = useLocationManager();

  useEffect(() => {
    const handleScroll = () => {
      // If user scrolls down more than 50px, activate scrolled mode
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Cleanup listener on unmount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const GUEST_ADDRESS = {
    formatted:
      "Navi Mumbai, Maharashtra 400703, India",
    isGuest: true,
  };


  const displayAddress =
    !(auth?.authToken || auth?.refreshToken) && !selectedAddress?.formatted
      ? GUEST_ADDRESS
      : selectedAddress;

  const handleNavigateOrders = (e) => {
    e.preventDefault();
    if (auth?.authToken || auth?.refreshToken) {
      navigate("/dashboard/orders");
    } else {
      setOpenLogin(true);
    }
  };

  const renderAvatar = () => {
    if (profileData?.profile_image) {
      return (
        <img
          src={profileData.profile_image}
          alt="Profile"
          className="w-100 h-100"
          style={{ objectFit: "cover" }}
        />
      );
    }

    // Default fallback to icon
    return <i className="fas fa-user text-white"></i>;
  };

  return (
    <>
      <div className={`navbar-theme ${isScrolled ? "scrolled" : ""}`}>
        <div className="d-none d-lg-block">
          {openLogin && <LoginModal setOpenLogin={setOpenLogin} />}
        </div>
        <div className="d-lg-none d-block">
          {openLogin && <PhoneLogin setOpenLogin={setOpenLogin} />}
        </div>
        {showLocationModal && (
          <LocationModal
            isOpen={showLocationModal}
            mapCenter={mapCenter}
            onClose={() => setShowLocationModal(false)}
            onConfirm={handleLocationConfirm}
          />
        )}
        <TopAppBanner />
        <div className="top-bar d-none d-lg-block">
          <div className="container-custom d-flex justify-content-between align-items-center">
            <div className="d-none d-md-block">
              <a style={{ cursor: "pointer", fontWeight: "600" }}>
                <span className="opacity-75">FRESH. </span>
                <span style={{ color: "#d7574c" }}>PREMIUM.</span>
                <span className="opacity-75"> SEAFOOD</span>
              </a>
            </div>
            <div className="d-flex ms-auto">
              <a onClick={(e) => handleNavigateOrders(e)} href="">
                Track Order
              </a>
              <span className="top-divider">|</span>
              {/* <a href="">Help</a> */}
              <a onClick={() => navigate("/help")} style={{ cursor: "pointer" }}>Help</a>
              <span className="top-divider">|</span>
              <a onClick={() => navigate("/app")} style={{ cursor: "pointer" }}>Download App</a>
            </div>
          </div>
        </div>

        {/* ---  Main Navbar --- */}
        <nav className="navbar-main">
          <div className="container-custom location-nav d-flex align-items-center justify-content-between flex-nowrap">
            {/*  Logo & Location */}
            <div className="d-flex align-items-center">
              <img
                className="d-none d-lg-block  brand-img"
                src="/fishlo-logo.svg"
                alt="Fishlo logo"
                onClick={() => navigate("/")}
                style={{ cursor: "pointer" }}
              />

              {/* Desktop Location Container - Controlled by React State */}
              <div className="location-nav ms-2" id="locationContainer">
                {isLoadingAddress ? (
                  <div
                    className="d-flex align-items-center gap-2"
                    style={{ padding: "5px 10px" }}
                  >
                    {/* Circle Icon Skeleton */}
                    <Skeleton circle width={32} height={32} />

                    <div className="d-flex flex-column">
                      {/* Label Skeleton (Delivering to) */}
                      <Skeleton
                        width={80}
                        height={10}
                        style={{ marginBottom: 4 }}
                      />
                      {/* Address Value Skeleton */}
                      <Skeleton width={140} height={14} />
                    </div>
                  </div>
                ) : displayAddress?.formatted ? (
                  <div
                    className="location-btn"
                    onClick={() => setShowLocationModal(true)}
                  >
                    <div className="location-icon-box">
                      <i className="bi bi-geo-alt-fill"></i>
                    </div>
                    <div className="d-flex flex-column">
                      <span className="loc-label">Delivering to</span>
                      <span
                        className="loc-value"
                        title={displayAddress?.formatted} /* Add this line */
                      >
                        {displayAddress?.formatted}
                        <i
                          className="bi bi-chevron-down ms-1"
                          style={{ fontSize: "0.7em" }}
                        ></i>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="location-btn-empty"
                    onClick={() => setShowLocationModal(true)}
                  >
                    <i className="bi bi-geo-alt loc-icon-empty"></i>
                    <div className="d-flex flex-column">
                      <span className="loc-label-empty">Please Select</span>
                      <span className="loc-value-empty">
                        Your Location
                        <i
                          className="bi bi-chevron-down ms-1"
                          style={{ fontSize: "0.7em" }}
                        ></i>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/*  The Modern Boxed Search Bar */}
            <div className="search-container d-none d-lg-block">
              <div className="search-form">
                {location.pathname !== "/search" ? (
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search for a fish.."
                    value=""
                    readOnly
                    onClick={() => navigate("/search")}
                  />
                ) : (
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search for a fish.."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                )}

                <button className="search-btn">
                  <Search size={28} strokeWidth={1} />
                </button>
              </div>
            </div>

            {/*  Right Actions */}
            <div className="nav-actions">
              {/* How it works */}
              <div
                onClick={() => navigate("/how-it-works")}
                className="action-item"
                style={{ cursor: "pointer" }}
              >
                <div className="icon-box">
                  <i className="bi bi-info-square"></i>
                </div>
                <div className="action-label d-none d-md-flex">
                  <span className="lbl-main">How it works?</span>
                </div>
              </div>

              {/* Account */}
              {(auth?.authToken || auth?.refreshToken) ? (
                <div className="dropdown d-none d-lg-block">
                  <button
                    className="d-flex align-items-center text-decoration-none dropdown-toggle text-dark bg-transparent border-0"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <div
                      className="bg-dark text-white rounded-circle d-flex justify-content-center align-items-center ms-2 overflow-hidden"
                      style={{
                        width: "36px",
                        height: "36px",
                      }}
                    >
                      {renderAvatar()}
                    </div>
                  </button>

                  <ul className="dropdown-menu dropdown-menu-end border-0 shadow-lg p-2 rounded-3">
                    <li>
                      <button
                        className="dropdown-item rounded-2 py-2"
                        onClick={() => navigate("/dashboard")}
                      >
                        <i className="fas fa-user-circle me-2 text-muted"></i>
                        My Account
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item rounded-2 py-2"
                        onClick={() => navigate("/dashboard/orders")}
                      >
                        <i className="fas fa-shopping-bag me-2 text-muted"></i>
                        Orders
                      </button>
                    </li>

                    {/* Added Settings */}
                    <li>
                      <button
                        className="dropdown-item rounded-2 py-2"
                        onClick={() => navigate("/dashboard/profile")}
                      >
                        <i className="fas fa-cog me-2 text-muted"></i>
                        Settings
                      </button>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li onClick={() => logout({ redirectTo: "/" })} disabled={logoutPending}>
                      <button className="dropdown-item rounded-2 py-2 text-danger">
                        <i className="fas fa-sign-out-alt me-2"></i> Logout
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <div
                  onClick={() => setOpenLogin(true)}
                  className="action-item account-hide"
                  style={{ cursor: "pointer" }}
                >
                  <div className="icon-box">
                    <i className="bi bi-person"></i>
                  </div>
                  <div className="action-label">
                    <span className="lbl-main">Login</span>
                  </div>
                </div>
              )}

              {/* Cart */}
              <div
                onClick={() => setCartOpen(true)}
                className="action-item"
                style={{ cursor: "pointer" }}
              >
                <div className="icon-box">
                  <ShoppingBasket size={28} strokeWidth={1} />
                  <span className="badge-count">{cart?.items_count || 0}</span>
                </div>
                {/* <div className="action-label">
                  <span className="lbl-main">₹24.00</span>
                </div> */}
              </div>
            </div>
          </div>
        </nav>

        {location.pathname === "/search" ? (
          <div className="d-lg-none d-block mt-2 w-100">
            <div className="container-custom">
              <div className="search-form mobile-search-form">
                {/* Move the icon here */}
                <div className="mobile-search-icon">
                  <Search size={20} strokeWidth={2} />
                </div>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search for a fish.."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <PopularSearches setSearch={setSearch} />
              <div className="page-header">
                <h4 className="m-0 fw-medium">Search Results</h4>
                <span className="results-info">
                  {productsData?.length === 0
                    ? "0 Items"
                    : `${productsData?.length || 0} Items`}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
