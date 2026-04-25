import React from "react";
import Skeleton from "react-loading-skeleton";

export default function StaffDesktopTable({
  loading,
  staffList,
  choicesData,
  filterRole,
  setFilterRole,
  filterStatus,
  setFilterStatus,
  searchTerm,
  setSearchTerm,
  onEdit,
  onToggleStatus,
}) {
  return (
    <div className="sd-table-card d-none d-md-block">
      <div className="sd-table-header border-bottom">
        <h5 className="mb-0 fw-medium text-dark">Team Members</h5>
        <div className="d-flex gap-2">
          <select
            className="form-select form-select-sm bg-light border-0 sd-input-clean"
            style={{ width: "130px" }}
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="All">All Roles</option>
            {choicesData?.roles?.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <select
            className="form-select form-select-sm bg-light border-0 sd-input-clean"
            style={{ width: "120px" }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            {choicesData?.statuses?.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="input-group input-group-sm" style={{ width: 200 }}>
            <span className="input-group-text bg-light border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control bg-light border-start-0 sd-input-clean"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="sd-table align-middle">
          <thead className="bg-light">
            <tr>
              <th className="ps-4">Name</th>
              <th>Role</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Joined</th>
              <th className="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-3">
                          <Skeleton circle width={40} height={40} />
                          <div className="w-100">
                            <Skeleton width={120} />
                            <Skeleton width={80} height={10} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <Skeleton width={100} />
                      </td>
                      <td>
                        <Skeleton width={120} />
                        <Skeleton width={100} height={10} />
                      </td>
                      <td>
                        <Skeleton width={80} />
                      </td>
                      <td>
                        <Skeleton width={90} />
                      </td>
                      <td className="text-end pe-4">
                        <Skeleton width={30} height={30} />
                      </td>
                    </tr>
                  ))
              : staffList?.map((staff) => (
                  <tr key={staff.id} className="sd-hover-row">
                    <td className="ps-4">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-3 d-flex align-items-center justify-content-center text-secondary fw-bold"
                          style={{
                            width: 40,
                            height: 40,
                            background: "#f1f5f9",
                            fontSize: "0.85rem",
                          }}
                        >
                          {staff.avatar_initials}
                        </div>
                        <div>
                          <div className="sd-user-name">
                            {staff.name.full_name}
                          </div>
                          <div className="sd-user-meta">
                            {staff.name.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge bg-white text-secondary border fw-normal px-2 py-1 rounded-pill"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {staff.role}
                      </span>
                    </td>
                    <td>
                      <div className="sd-user-name small">{staff.contact}</div>
                    </td>
                    <td>
                      <span
                        className={`sd-pill ${
                          staff.status === "Active"
                            ? "packed"
                            : staff.status === "On Leave"
                            ? "on-leave"
                            : "pending"
                        }`}
                      >
                        <i className="bi bi-dot"></i>
                        {staff.status}
                      </span>
                    </td>
                    <td className="sd-user-meta text-dark">{staff.joined}</td>
                    <td className="text-end pe-4">
                      <button
                        className="btn btn-sm sd-btn-ghost me-2"
                        onClick={() => onEdit(staff)}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button
                        className={`btn btn-sm p-0 ${
                          staff.status === "Inactive"
                            ? "text-success"
                            : "text-danger"
                        }`}
                        title={
                          staff.status === "Inactive"
                            ? "Mark as Active"
                            : "Mark as Inactive"
                        }
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
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
