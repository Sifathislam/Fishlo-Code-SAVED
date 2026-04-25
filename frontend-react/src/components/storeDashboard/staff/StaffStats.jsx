import React from "react";
import Skeleton from "react-loading-skeleton";

export default function StaffStats({ loading, summary }) {
  return (
    <div className="row g-3 mb-4">
      <div className="col-md-4">
        <div className="sd-brand-card p-3 h-100 align-items-center">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 64, height: 64, background: "#dbeafe", color: "#2563eb" }}
          >
            <i className="bi bi-people-fill fs-3"></i>
          </div>
          <div className="ms-3">
            {loading ? (
              <Skeleton width={50} height={30} />
            ) : (
              <div className="fw-medium fs-3 text-dark lh-1 mb-1">
                {summary?.total_staff || 0}
              </div>
            )}
            <div className="text-secondary small fw-medium text-uppercase ls-1">
              Total Staff
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="sd-brand-card p-3 h-100 align-items-center">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 64, height: 64, background: "#dcfce7", color: "#16a34a" }}
          >
            <i className="bi bi-person-check-fill fs-3"></i>
          </div>
          <div className="ms-3">
            {loading ? (
              <Skeleton width={50} height={30} />
            ) : (
              <div className="fw-medium fs-3 text-dark lh-1 mb-1">
                {summary?.active_now || 0}
              </div>
            )}
            <div className="text-secondary small fw-medium text-uppercase ls-1">
              Active Now
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="sd-brand-card p-3 h-100 align-items-center">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 64, height: 64, background: "#fff0ef", color: "#d7574c" }}
          >
            <i className="bi bi-person-dash-fill fs-3"></i>
          </div>
          <div className="ms-3">
            {loading ? (
              <Skeleton width={50} height={30} />
            ) : (
              <div className="fw-medium fs-3 text-dark lh-1 mb-1">
                {summary?.on_leave || 0}
              </div>
            )}
            <div className="text-secondary small fw-medium text-uppercase ls-1">
              On Leave
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
