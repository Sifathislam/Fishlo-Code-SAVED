import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { usePartnerStatus, useUpdatePartnerStatus, useDashboardStats } from "../../features/useDeliveryAssignment";
import "../../styles/delivery.css";

const DeliveryLayout = () => {
  const { data: statusResponse } = usePartnerStatus();
  const { data: statsResponse } = useDashboardStats();
  const updateStatusMutation = useUpdatePartnerStatus();
  const isOnline = statusResponse?.data?.is_active_duty || false;
  const pendingOrders = statsResponse?.data?.pending_orders || 0;

  const handleToggleStatus = (e) => {
    updateStatusMutation.mutate(e.target.checked);
  };

  return (
    <div className="delivery-layout">
      {/* Mobile Only Overlay */}
      <div className="mobile-only-overlay">
        <div className="overlay-content">
          <i className="fa fa-mobile-phone overlay-icon"></i>
          <h2>Mobile Only Access</h2>
          <p>The Fishlo Partner app is optimized specifically for mobile devices. Please open this link on your smartphone to continue.</p>
        </div>
      </div>

      {/* Minimalist Header */}
      <header className="delivery-header-clean">
        <div className="header-brand-group">
          <h1 className="header-brand">Fishlo Partner</h1>
          <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
        </div>

        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={isOnline}
            onChange={handleToggleStatus}
            disabled={updateStatusMutation.isPending}
          />
          <span className="slider round"></span>
        </label>
      </header>

      <main className="delivery-content-tight">
        <Outlet />
      </main>

      <nav className="delivery-nav-clean">
        <div className="nav-container-flex">
          <NavLink
            to="/delivery"
            end
            className={({ isActive }) => `delivery-nav-item ${isActive ? "active" : ""}`}
          >
            <div className="nav-icon-wrapper">
              <i className="fa fa-home"></i>
            </div>
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/delivery/orders"
            className={({ isActive }) => `delivery-nav-item ${isActive ? "active" : ""}`}
            style={{ position: 'relative' }}
          >
            <div className="nav-icon-wrapper">
              <i className="fa fa-list-alt"></i>
              {pendingOrders > 0 && (
                <span className="nav-badge">{pendingOrders}</span>
              )}
            </div>
            <span>Orders</span>
          </NavLink>

          <NavLink
            to="/delivery/history"
            className={({ isActive }) => `delivery-nav-item ${isActive ? "active" : ""}`}
          >
            <div className="nav-icon-wrapper">
              <i className="fa fa-history"></i>
            </div>
            <span>History</span>
          </NavLink>

          <NavLink
            to="/delivery/profile"
            className={({ isActive }) => `delivery-nav-item ${isActive ? "active" : ""}`}
          >
            <div className="nav-icon-wrapper">
              <i className="fa fa-user"></i>
            </div>
            <span>Profile</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default DeliveryLayout;
