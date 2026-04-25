import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import useAuth from "../../hooks/useAuth";
import { usePartnerProfile, useUpdateProfileImage } from "../../features/useDeliveryAssignment";
import { useLogout } from "../../features/useLogout";

const DeliveryProfile = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const fileInputRef = useRef(null);
  const logoutMutation = useLogout();

  const { data: profileResponse, isLoading, isError, refetch } = usePartnerProfile();
  const updateImageMutation = useUpdateProfileImage();

  const handleLogout = () => {
    logoutMutation.mutate({ redirectTo: "/delivery/login" });
  };
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("profile_image", file);
      try {
        await updateImageMutation.mutateAsync(formData);
      } catch (err) {
        console.error("Failed to upload image:", err);
        alert("Failed to upload image. Please try again.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="delivery-profile-wrapper">
        <div className="profile-header-section glass-effect" style={{ height: "180px", justifyContent: "center" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="delivery-profile-wrapper">
        <div className="alert alert-danger m-3">
          <p>Failed to load profile. Please check your connection.</p>
          <button className="btn btn-sm btn-outline-danger" onClick={() => refetch()}>Try Again</button>
        </div>
      </div>
    );
  }

  const profile = profileResponse?.data || {};

  return (
    <div className="delivery-profile-wrapper">
      <div className="profile-header-section glass-effect">
        <div className="profile-avatar-container">
          <div className="profile-avatar" onClick={handleAvatarClick}>
            {updateImageMutation.isPending ? (
              <div className="spinner-border spinner-border-sm text-white" role="status"></div>
            ) : profile.profile_image ? (
              <img src={profile.profile_image} alt="Profile" />
            ) : (
              <i className="fa fa-user"></i>
            )}
            <div className="profile-image-overlay">
              <i className="fa fa-camera"></i>
            </div>
          </div>
          <div className={`profile-status-badge ${profile.is_active_duty ? 'online' : 'offline'}`}></div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: "none" }}
          />
        </div>
        <h2 className="profile-name">{profile.full_name || "Partner Name"}</h2>
        <p className="profile-phone">{profile.phone || "+91 XXXXX XXXXX"}</p>
        <span className="badge mt-1" style={{ backgroundColor: "#fafbfc", color: "#6c757d", border: "1px solid #dee2e6", fontWeight: "500" }}>
          ID: {profile.employee_id || "N/A"}
        </span>
      </div>

      <div className="delivery-card profile-menu-card">
        <div className="profile-menu-item">
          <div className="menu-icon bg-primary-light">
            <i className="fa fa-motorcycle text-primary"></i>
          </div>
          <div className="menu-content">
            <span className="menu-title">Vehicle Details</span>
            <span className="menu-subtitle">{profile.vehicle_type} - {profile.vehicle_number || "No Number"}</span>
          </div>
          <i className="fa fa-chevron-right menu-arrow"></i>
        </div>

        <div className="profile-menu-item">
          <div className="menu-icon bg-warning-light">
            <i className="fa fa-star text-warning"></i>
          </div>
          <div className="menu-content">
            <span className="menu-title">My Zone</span>
            <span className="menu-subtitle">{profile.zone_name || "General"}</span>
          </div>
          <i className="fa fa-chevron-right menu-arrow"></i>
        </div>

        <div className="profile-menu-item" onClick={() => navigate("/delivery/withdraw")}>
          <div className="menu-icon bg-gray-light">
            <i className="fa fa-wallet text-muted"></i>
          </div>
          <div className="menu-content">
            <span className="menu-title">Wallet Balance</span>
            <span className="menu-subtitle">₹ {profile.wallet_balance || "0.00"}</span>
          </div>
          <i className="fa fa-chevron-right menu-arrow"></i>
        </div>

        <div className="profile-menu-item">
          <div className="menu-icon bg-info-light">
            <i className="fa fa-id-card text-info"></i>
          </div>
          <div className="menu-content">
            <span className="menu-title">License Info</span>
            <span className="menu-subtitle">{profile.license_number || "Not provided"}</span>
          </div>
          <i className="fa fa-chevron-right menu-arrow"></i>
        </div>

        <div className="profile-menu-item no-border" onClick={() => navigate("/delivery/change-password")}>
          <div className="menu-icon bg-secondary-light">
            <i className="fa fa-lock text-secondary"></i>
          </div>
          <div className="menu-content">
            <span className="menu-title">Change Password</span>
            <span className="menu-subtitle">Update your login password</span>
          </div>
          <i className="fa fa-chevron-right menu-arrow"></i>
        </div>
      </div>

      <div className="profile-actions-bottom">
        <button className="delivery-btn btn-withdrawal" onClick={() => navigate("/delivery/withdraw")}>
          <i className="fa fa-money mr-2"></i>
          Request Withdrawal
        </button>

        <button
          className="delivery-btn delivery-btn-outline btn-logout"
          onClick={handleLogout}
        >
          <i className="fa fa-sign-out mr-2"></i>
          Logout
        </button>
      </div>
    </div>
  );
};

export default DeliveryProfile;
