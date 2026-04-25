import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import DashboardSidebar from "../components/dashboard/Sidebar";
import { useGetProfile } from "../features/useGetProfile";

function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data } = useGetProfile();

  const fullName =
    `${data?.first_name || ""} ${data?.last_name || ""}`.trim() || "Guest User";
  const initials =
    data?.first_name && data?.last_name ? (
      `${data.first_name[0]}${data.last_name[0]}`.toUpperCase()
    ) : (
      <i className="fas fa-user text-primary"></i>
    );
  const phoneNumber = data?.phone_number || "No Phone Number";
  const isVerified = data?.phone_verified === true;

  return (
    <div className="fishlo-app fishlo-dashboard-theme">
      {/* Profile Hero */}
      <section className="profile-hero">
        <div className="fishlo-container">
          <div className="row align-items-center">
            <div className="col-md-auto text-center text-md-start mb-3 mb-md-0">
              <div
                className="avatar-box mx-auto shadow-lg border border-2 border-white border-opacity-25 d-flex align-items-center justify-content-center bg-white text-dark fs-2 fw-medium overflow-hidden"
                style={{ width: "100px", height: "100px", borderRadius: "50%" }}
              >
                {data?.profile_image ? (
                  <img
                    src={data.profile_image}
                    alt="profile"
                    className="w-100 h-100 object-fit-cover"
                  />
                ) : (
                  initials
                )}
              </div>
            </div>
            <div className="col-md text-center text-md-start">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start mb-1">
                <h2 className="fw-medium mb-0 me-3">{fullName}</h2>
                <Link
                  to="/dashboard/profile"
                  className="btn btn-sm btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center"
                  style={{ width: "32px", height: "32px" }}
                  title="Edit Profile"
                >
                  <i className="fas fa-pencil-alt text-muted fs-6"></i>
                </Link>
              </div>
              <div className="d-flex align-items-center justify-content-center justify-content-md-start">
                <p className="mb-0 text-white-50 me-2">
                  <i className="fas fa-phone-alt me-2"></i>
                  {phoneNumber}
                </p>
                {isVerified && (
                  <span
                    className="badge rounded-pill bg-success d-flex align-items-center"
                    style={{ fontSize: "0.65rem", paddingTop: "5px", paddingBottom: "2px" }}
                  >
                    <i className="fas fa-check-circle me-1 mb-1"></i> Verified
                  </span>
                )}
              </div>
            </div>
            <div className="col-md-auto text-center text-md-end mt-4 mt-md-0">
            </div>
          </div>
        </div>
      </section>

      {/* Main Layout */}
      <div
        className="d-flex align-items-center mb-2 d-md-none d-sm-block"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <button
          className="btn text-white me-3 border-0 bg-transparent p-0"
          type="button"
          style={{ marginLeft: "18px" }}
        >
          <i className="fas fa-bars fa-lg"></i>
        </button>
      </div>
      <div className="fishlo-container mb-5 pb-5">
        <div className="row g-4">
          {/* Sidebar (Desktop) */}
          <DashboardSidebar
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />

          {/* Content Area */}
          <div className="col-lg-9">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
