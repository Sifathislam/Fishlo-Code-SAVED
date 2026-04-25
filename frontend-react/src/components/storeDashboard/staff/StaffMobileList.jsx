import React from "react";
import Skeleton from "react-loading-skeleton";

export default function StaffMobileList({
  loading,
  staffList,
  searchTerm,
  setSearchTerm,
  onEdit,
  onToggleStatus,
}) {
  return (
    <div className="d-md-none">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0 fw-medium text-dark">Team Members</h5>
      </div>
      <div className="mb-3">
        <div className="input-group">
          <span className="input-group-text bg-white border-end-0">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control bg-white border-start-0"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      {loading
        ? Array(3)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="mb-3 p-3 bg-white rounded-4 border shadow-sm"
              >
                <div className="d-flex gap-3 mb-3">
                  <Skeleton circle width={50} height={50} />
                  <div>
                    <Skeleton width={120} height={15} />
                    <Skeleton width={80} height={10} className="mt-1" />
                  </div>
                </div>
              </div>
            ))
        : staffList?.map((staff) => (
            <div
              key={staff.id}
              className="sd-brand-card p-3 mb-3 flex-column align-items-stretch gap-3"
            >
              <div className="d-flex justify-content-between align-items-start">
                <div className="d-flex gap-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center text-secondary fw-bold"
                    style={{
                      width: 50,
                      height: 50,
                      background: "#f1f5f9",
                    }}
                  >
                    {staff.avatar_initials}
                  </div>
                  <div>
                    <div className="fw-medium text-dark">
                      {staff.name.full_name}
                    </div>
                    <div className="small text-muted">{staff.role}</div>
                  </div>
                </div>
                <span
                  className={`sd-pill ${
                    staff.status === "Active"
                      ? "packed"
                      : staff.status === "On Leave"
                      ? "on-leave"
                      : "pending"
                  }`}
                >
                  {staff.status}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-1">
                <div className="small text-muted">
                  <i className="bi bi-telephone me-1"></i> {staff.contact}
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm sd-btn-ghost py-1 px-3"
                    onClick={() => onEdit(staff)}
                  >
                    Edit
                  </button>
                  <button
                    className={`btn btn-sm py-1 px-3 border-0 ${
                      staff.status === "Inactive"
                        ? "btn-outline-success"
                        : "btn-outline-danger"
                    }`}
                    onClick={() => onToggleStatus(staff.id, staff.status)}
                  >
                    <i
                      className={`bi ${
                        staff.status === "Inactive"
                          ? "bi-person-check"
                          : "bi-person-slash"
                      }`}
                    ></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
    </div>
  );
}
