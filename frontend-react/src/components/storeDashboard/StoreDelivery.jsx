import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  useCreateDeliveryPartner,
  useDeactivateDeliveryPartner,
  useStoreDeliveryPartners,
  useUpdateDeliveryPartner,
} from "../../features/useStoreDelivery";
import { formatDate } from "../../shared/utils/dateUtils";

const STATUS_OPTIONS = ["Active", "On Leave", "Inactive"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDERS = ["Male", "Female", "Other"];
const VEHICLE_TYPES = ["Bike", "Scooter", "Bicycle"];

export default function StoreDelivery() {
  document.title = "Delivery - Store Dashboard";
  const [editingStaff, setEditingStaff] = useState(null);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showModal, setShowModal] = useState(false);

  // Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterVehicleType, setFilterVehicleType] = useState("All Vehicles");

  // Form State
  const [formData, setFormData] = useState({});

  // API Hooks
  const { data: staffDataResponse, isLoading: loading } =
    useStoreDeliveryPartners({
      search: searchTerm,
      status: filterStatus,
      vehicle_type: filterVehicleType,
    });

  const staffList = staffDataResponse?.data || [];

  const createPartner = useCreateDeliveryPartner();
  const updatePartner = useUpdateDeliveryPartner();
  const deactivatePartner = useDeactivateDeliveryPartner();

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "Delivery@123",
      status: "Active",
      vehicle_type: "Bike",
      vehicle_number: "",
      license_number: "",
      blood_group: "O+",
      address: "",
      emergency_contact: "",
      joining_date: new Date().toISOString().split("T")[0],
      dob: "",
      gender: "Male",
      vehicle_insurance_expiry: "",
      bank_account_number: "",
      ifsc_code: "",
      bank_name: "",
      upi_id: "",
      employee_id: "",
    });
  };

  const handleOpenModal = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        first_name: staff.first_name || "",
        last_name: staff.last_name || "",
        email: staff.email || "", // Ensure your API returns this
        phone: staff.phone || "",
        status: staff.status || "Active",
        vehicle_type: staff.vehicle_type || "Bike",
        vehicle_number: staff.vehicle_number || "",
        license_number: staff.license_number || "",
        blood_group: staff.blood_group || "O+",
        address: staff.address || "",
        emergency_contact: staff.emergency_contact || "",
        joining_date: staff.joining_date || "",
        dob: staff.dob || "",
        gender: staff.gender || "Male",
        vehicle_insurance_expiry: staff.vehicle_insurance_expiry || "",
        bank_account_number: staff.bank_account_number || "",
        ifsc_code: staff.ifsc_code || "",
        bank_name: staff.bank_name || "",
        upi_id: staff.upi_id || "",
        employee_id: staff.employee_id || "",
      });
    } else {
      setEditingStaff(null);
      resetForm();
    }
    setFormError(null);
    setFieldErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStaff(null);
    setFieldErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user changes value
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Only pass along defined and non-empty string fields (API compatibility)
    const submitData = { ...formData };

    // Clean up empty strings for date fields to prevent backend validation errors
    if (!submitData.dob) delete submitData.dob;
    if (!submitData.vehicle_insurance_expiry)
      delete submitData.vehicle_insurance_expiry;
    if (!submitData.joining_date) delete submitData.joining_date;

    // If updating, don't send empty password
    if (editingStaff && !submitData.password) {
      delete submitData.password;
    }

    if (editingStaff) {
      updatePartner.mutate(
        { id: editingStaff.id, ...submitData },
        {
          onSuccess: () => {
            handleCloseModal();
          },
          onError: (err) => {
            const errorData = err.response?.data?.data;
            if (errorData && typeof errorData === "object") {
              setFieldErrors(errorData);
            }
            const errorMsg =
              err.response?.data?.message || "Failed to update profile";
            setFormError(errorMsg);
          },
        },
      );
    } else {
      createPartner.mutate(submitData, {
        onSuccess: () => {
          handleCloseModal();
        },
        onError: (err) => {
          const errorData = err.response?.data?.data;
          if (errorData && typeof errorData === "object") {
            setFieldErrors(errorData);
          }
          const errorMsg =
            err.response?.data?.message || "Failed to create profile";
          setFormError(errorMsg);
        },
      });
    }
  };

  const handleDeactivate = (id) => {
    if (
      window.confirm(
        "Are you sure you want to mark this delivery partner as Inactive?",
      )
    ) {
      deactivatePartner.mutate(id, {
        onError: (err) =>
          alert(err.response?.data?.message || "Failed to deactivate partner"),
      });
    }
  };

  // Stats
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.status === "Active").length;
  const onLeaveStaff = staffList.filter((s) => s.status === "On Leave").length;

  // Filter Logic is now handled by the API mostly, but keeping this for local rendering stability
  const filteredStaffList = staffList;

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
        <div>
          <h2 className="sd-header-title mb-1">Delivery Team</h2>
          <p className="sd-header-subtitle mb-0">
            Manage your delivery partners
          </p>
        </div>
        <button
          className="sd-btn-primary shadow-sm d-flex align-items-center justify-content-center gap-2"
          onClick={() => handleOpenModal()}
          style={{ whiteSpace: "nowrap" }}
        >
          <i className="bi bi-person-plus-fill"></i> Add Delivery
        </button>
      </div>

      {/* Stats Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="sd-brand-card p-3 h-100 align-items-center">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                width: 64,
                height: 64,
                background: "#dbeafe",
                color: "#2563eb",
              }}
            >
              <i className="bi bi-bicycle fs-3"></i>
            </div>
            <div className="ms-3">
              {loading ? (
                <Skeleton width={50} height={30} />
              ) : (
                <div className="fw-medium fs-3 text-dark lh-1 mb-1">
                  {totalStaff}
                </div>
              )}
              <div className="text-secondary small fw-medium text-uppercase ls-1">
                Total Riders
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="sd-brand-card p-3 h-100 align-items-center">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                width: 64,
                height: 64,
                background: "#dcfce7",
                color: "#16a34a",
              }}
            >
              <i className="bi bi-geo-alt-fill fs-3"></i>
            </div>
            <div className="ms-3">
              {loading ? (
                <Skeleton width={50} height={30} />
              ) : (
                <div className="fw-medium fs-3 text-dark lh-1 mb-1">
                  {activeStaff}
                </div>
              )}
              <div className="text-secondary small fw-medium text-uppercase ls-1">
                On Duty
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="sd-brand-card p-3 h-100 align-items-center">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                width: 64,
                height: 64,
                background: "#fff0ef",
                color: "#d7574c",
              }}
            >
              <i className="bi bi-slash-circle fs-3"></i>
            </div>
            <div className="ms-3">
              {loading ? (
                <Skeleton width={50} height={30} />
              ) : (
                <div className="fw-medium fs-3 text-dark lh-1 mb-1">
                  {onLeaveStaff}
                </div>
              )}
              <div className="text-secondary small fw-medium text-uppercase ls-1">
                Off Duty
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staff List Table (Desktop) */}
      <div className="sd-table-card d-none d-md-block">
        <div className="sd-table-header border-bottom">
          <h5 className="mb-0 fw-medium text-dark">Riders</h5>
          <div className="d-flex gap-2">
            <select
              className="form-select form-select-sm bg-light border-0 sd-input-clean"
              style={{ width: "120px" }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="form-select form-select-sm bg-light border-0 sd-input-clean"
              style={{ width: "120px" }}
              value={filterVehicleType}
              onChange={(e) => setFilterVehicleType(e.target.value)}
            >
              <option value="All">All Vehicles</option>
              {VEHICLE_TYPES.map((v) => (
                <option key={v} value={v}>
                  {v}
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
                placeholder="Search riders..."
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
                <th>Vehicle</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Earnings</th>
                <th>Joined</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? // Skeleton Rows
                  Array(5)
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
                          <Skeleton width={80} />
                          <Skeleton width={60} height={10} />
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
                : filteredStaffList.map((staff) => (
                    <tr key={staff.id} className="sd-hover-row">
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={
                              staff.profile_image ||
                              `https://ui-avatars.com/api/?name=${staff.first_name}+${staff.last_name}&background=cbd5e1&color=fff`
                            }
                            alt={staff.first_name}
                            className="rounded-3 object-fit-cover"
                            width="40"
                            height="40"
                            style={{ background: "#f1f5f9" }}
                          />
                          <div>
                            <div className="sd-user-name">
                              {staff.first_name} {staff.last_name}
                            </div>
                            <div className="sd-user-meta border bg-light d-inline-block px-1 rounded border-secondary mt-1">
                              {staff.employee_id || "No ID"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className="badge bg-white text-secondary border fw-normal px-2 py-1 rounded-pill"
                          style={{ fontSize: "0.75rem" }}
                        >
                          <i className="bi bi-bicycle me-1 opacity-50"></i>
                          {staff.role || "Delivery"}
                        </span>
                      </td>
                      <td>
                        <div className="fw-medium fs-6 text-dark">
                          {staff.vehicle_type}
                        </div>
                        {staff.vehicle_number && (
                          <div
                            className="small text-muted"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {staff.vehicle_number}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="sd-user-name small">{staff.phone}</div>
                      </td>
                      <td>
                        <span
                          className={`sd-pill ${
                            staff.status === "Active"
                              ? "packed"
                              : staff.status === "On Leave"
                                ? "on-leave"
                                : staff.status === "Inactive"
                                  ? "pending"
                                  : ""
                          }`}
                        >
                          <i className="bi bi-dot"></i>
                          {staff.status}
                        </span>
                      </td>
                      <td>
                        <div className="fw-medium text-dark text-nowrap">
                          ₹{staff.total_earned}
                        </div>
                        <div
                          className="text-muted small"
                          style={{ fontSize: "0.75rem" }}
                        >
                          Bal: ₹{staff.wallet_balance}
                        </div>
                      </td>
                      <td className="sd-user-meta text-dark">
                        {staff.joining_date
                          ? formatDate(staff.joining_date)
                          : "-"}
                      </td>
                      <td className="text-end pe-4">
                        <button
                          className="btn btn-sm sd-btn-ghost me-2"
                          onClick={() => handleOpenModal(staff)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        {staff.status !== "Inactive" && (
                          <button
                            className="btn btn-sm btn-link text-danger p-0"
                            title="Mark as Inactive"
                            onClick={() => handleDeactivate(staff.id)}
                          >
                            <i className="bi bi-person-slash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff List Mobile Cards */}
      <div className="d-md-none">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0 fw-medium text-dark">Riders List</h5>
        </div>

        {/* Mobile Search */}
        <div className="mb-3">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control bg-white border-start-0"
              placeholder="Search riders..."
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
          : filteredStaffList.map((staff) => (
              <div
                key={staff.id}
                className="sd-brand-card p-3 mb-2 flex-column align-items-stretch gap-2"
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="d-flex gap-2">
                    <img
                      src={
                        staff.profile_image ||
                        `https://ui-avatars.com/api/?name=${staff.first_name}+${staff.last_name}&background=cbd5e1&color=fff`
                      }
                      alt={staff.first_name}
                      className="rounded-3 object-fit-cover"
                      width="40"
                      height="40"
                      style={{ background: "#f1f5f9" }}
                    />
                    <div>
                      <div className="fw-medium text-dark lh-1 mb-1">
                        {staff.first_name} {staff.last_name}
                      </div>
                      <div
                        className="small text-muted"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {staff.role}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`sd-pill ${
                      staff.status === "Active"
                        ? "packed"
                        : staff.status === "On Leave"
                          ? "on-leave"
                          : staff.status === "Inactive"
                            ? "pending"
                            : ""
                    }`}
                    style={{ padding: "4px 8px", fontSize: "0.65rem" }}
                  >
                    {staff.status}
                  </span>
                </div>

                {/* Vehicle Info (Mobile) */}
                <div className="bg-light rounded-3 px-2 py-1 mt-1">
                  <div className="d-flex align-items-center gap-2">
                    <i
                      className="bi bi-bicycle text-secondary"
                      style={{ fontSize: "0.9rem" }}
                    ></i>
                    <div>
                      <span
                        className="fw-medium text-dark me-2"
                        style={{ fontSize: "0.8rem" }}
                      >
                        {staff.vehicle_type}
                      </span>
                      {staff.vehicle_number && (
                        <span
                          className="text-muted border-start ps-2"
                          style={{ fontSize: "0.75rem" }}
                        >
                          {staff.vehicle_number}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-1">
                  <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                    <i className="bi bi-telephone me-1"></i> {staff.phone}
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm sd-btn-ghost py-0 px-2"
                      style={{ fontSize: "0.8rem", height: "28px" }}
                      onClick={() => handleOpenModal(staff)}
                    >
                      Edit
                    </button>
                    {staff.status !== "Inactive" && (
                      <button
                        className="btn btn-sm btn-outline-danger py-0 px-2 border-0"
                        style={{ fontSize: "0.8rem", height: "28px" }}
                        onClick={() => handleDeactivate(staff.id)}
                      >
                        <i className="bi bi-person-slash"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
      </div>

      {showModal && (
        <div
          className="sd-modal-overlay"
          style={{
            background: "rgba(0,0,0,0.5)",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1050,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="bg-white rounded-4 shadow-lg w-100"
            style={{
              maxWidth: "800px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              animation: "slideUp 0.3s ease-out",
            }}
          >
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center flex-shrink-0">
              <div>
                <h5 className="fw-medium mb-0 text-dark">
                  {editingStaff ? "Edit Rider Profile" : "Add New Rider"}
                </h5>
                <p className="small text-muted mb-0">
                  Enter the details for your delivery partner
                </p>
              </div>
              <button className="btn-close" onClick={handleCloseModal}></button>
            </div>

            {formError && (
              <div className="px-4 pt-3">
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-0 py-2 border-0 rounded-3 shadow-sm bg-danger-subtle text-danger small">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <div className="flex-grow-1">{formError}</div>
                  <button
                    type="button"
                    className="btn-close small"
                    style={{ fontSize: "0.65rem" }}
                    onClick={() => setFormError(null)}
                  ></button>
                </div>
              </div>
            )}

            <div className="p-4" style={{ overflowY: "auto" }}>
              <form id="riderForm" onSubmit={handleSubmit}>
                {/* Section 1: Personal Details */}
                <div className="mb-4">
                  <h6 className="fw-medium text-uppercase small text-muted ls-1 mb-3 border-bottom pb-2">
                    1. Personal Details
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-medium text-secondary">
                        First Name <span className="text-danger">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        name="first_name"
                        className={`form-control ${fieldErrors.first_name ? "is-invalid" : ""}`}
                        value={formData.first_name || ""}
                        onChange={handleInputChange}
                      />
                      {fieldErrors.first_name && (
                        <div className="invalid-feedback d-block">
                          {fieldErrors.first_name[0]}
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-medium text-secondary">
                        Last Name <span className="text-danger">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        name="last_name"
                        className={`form-control ${fieldErrors.last_name ? "is-invalid" : ""}`}
                        value={formData.last_name || ""}
                        onChange={handleInputChange}
                      />
                      {fieldErrors.last_name && (
                        <div className="invalid-feedback d-block">
                          {fieldErrors.last_name[0]}
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-medium text-secondary">
                        Employee ID
                      </label>
                      <input
                        type="text"
                        name="employee_id"
                        className={`form-control ${fieldErrors.employee_id ? "is-invalid" : ""}`}
                        value={formData.employee_id || ""}
                        onChange={handleInputChange}
                        placeholder="e.g. EMP-1234"
                      />
                      {fieldErrors.employee_id && (
                        <div className="invalid-feedback d-block">
                          {fieldErrors.employee_id[0]}
                        </div>
                      )}
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-medium text-secondary">
                        Gender
                      </label>
                      <select
                        className="form-select"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                      >
                        {GENDERS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-medium text-secondary">
                        Blood Group
                      </label>
                      <select
                        className="form-select"
                        name="blood_group"
                        value={formData.blood_group}
                        onChange={handleInputChange}
                      >
                        {BLOOD_GROUPS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-medium text-secondary">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dob"
                        className={`form-control ${fieldErrors.dob ? "is-invalid" : ""}`}
                        value={formData.dob}
                        onChange={handleInputChange}
                      />
                      {fieldErrors.dob && (
                        <div className="invalid-feedback d-block">
                          {fieldErrors.dob[0]}
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-medium text-secondary">
                        Status
                      </label>
                      <select
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Contact Info */}
                <div className="mb-4">
                  <h6 className="fw-medium text-uppercase small text-muted ls-1 mb-3 border-bottom pb-2">
                    2. Contact Info
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-medium text-secondary">
                        Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        required
                        type="email"
                        name="email"
                        className={`form-control ${fieldErrors.email ? "is-invalid" : ""}`}
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                      {fieldErrors.email && (
                        <div className="invalid-feedback d-block">
                          {fieldErrors.email[0]}
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-medium text-secondary">
                        Phone Number <span className="text-danger">*</span>
                      </label>
                      <input
                        required
                        type="tel"
                        name="phone"
                        className={`form-control ${fieldErrors.phone ? "is-invalid" : ""}`}
                        value={formData.phone || ""}
                        onChange={handleInputChange}
                        maxLength={10}
                      />
                      {fieldErrors.phone && (
                        <div className="invalid-feedback d-block">
                          {fieldErrors.phone[0]}
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label small fw-medium text-secondary mb-0">
                          Emergency Contact{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <button
                          type="button"
                          className="btn btn-sm btn-link p-0 text-primary small"
                          style={{ fontSize: "0.75rem" }}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              emergency_contact: prev.phone,
                            }))
                          }
                        >
                          Same as Phone
                        </button>
                      </div>
                      <input
                        required
                        type="tel"
                        name="emergency_contact"
                        className={`form-control ${fieldErrors.emergency_contact ? "is-invalid" : ""}`}
                        value={formData.emergency_contact}
                        onChange={handleInputChange}
                        maxLength={10}
                      />
                      {fieldErrors.emergency_contact && (
                        <div className="invalid-feedback d-block">
                          {fieldErrors.emergency_contact[0]}
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-medium text-secondary">
                        Residential Address{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <textarea
                        required
                        name="address"
                        className={`form-control ${fieldErrors.address ? "is-invalid" : ""}`}
                        rows="1"
                        value={formData.address}
                        onChange={handleInputChange}
                      ></textarea>
                      {fieldErrors.address && (
                        <div className="invalid-feedback d-block">
                          {fieldErrors.address[0]}
                        </div>
                      )}
                    </div>

                    {!editingStaff && (
                      <div className="col-12 mt-2">
                        <div className="bg-light p-3 rounded-3 border">
                          <label className="form-label small fw-medium text-secondary mb-1">
                            Login Password
                          </label>
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold text-dark">
                              Delivery@123
                            </span>
                            <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-1">
                              Default Password
                            </span>
                          </div>
                          <p className="small text-muted mb-0 mt-1">
                            This password will be assigned to the new rider
                            automatically.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Vehicle Info */}
                <div className="mb-4">
                  <h6 className="fw-medium text-uppercase small text-muted ls-1 mb-3 border-bottom pb-2">
                    3. Vehicle Info (Optional)
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-medium text-secondary">
                        Vehicle Type
                      </label>
                      <select
                        className="form-select"
                        name="vehicle_type"
                        value={formData.vehicle_type}
                        onChange={handleInputChange}
                      >
                        {VEHICLE_TYPES.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    {formData.vehicle_type !== "Bicycle" && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label small fw-medium text-secondary">
                            Vehicle Number
                          </label>
                          <input
                            type="text"
                            name="vehicle_number"
                            className={`form-control ${fieldErrors.vehicle_number ? "is-invalid" : ""}`}
                            value={formData.vehicle_number}
                            onChange={handleInputChange}
                            placeholder="e.g. DL-01-AB-1234"
                          />
                          {fieldErrors.vehicle_number && (
                            <div className="invalid-feedback d-block">
                              {fieldErrors.vehicle_number[0]}
                            </div>
                          )}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-medium text-secondary">
                            Driving License No.
                          </label>
                          <input
                            type="text"
                            name="license_number"
                            className={`form-control ${fieldErrors.license_number ? "is-invalid" : ""}`}
                            value={formData.license_number}
                            onChange={handleInputChange}
                          />
                          {fieldErrors.license_number && (
                            <div className="invalid-feedback d-block">
                              {fieldErrors.license_number[0]}
                            </div>
                          )}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-medium text-secondary">
                            Insurance Expiry
                          </label>
                          <input
                            type="date"
                            name="vehicle_insurance_expiry"
                            className={`form-control ${fieldErrors.vehicle_insurance_expiry ? "is-invalid" : ""}`}
                            value={formData.vehicle_insurance_expiry}
                            onChange={handleInputChange}
                          />
                          {fieldErrors.vehicle_insurance_expiry && (
                            <div className="invalid-feedback d-block">
                              {fieldErrors.vehicle_insurance_expiry[0]}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Section 4: Bank Details */}
                <div>
                  <h6 className="fw-medium text-uppercase small text-muted ls-1 mb-3 border-bottom pb-2">
                    4. Bank Details
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-medium text-secondary">
                        UPI ID (Optional)
                      </label>
                      <input
                        type="text"
                        name="upi_id"
                        className={`form-control ${fieldErrors.upi_id ? "is-invalid" : ""}`}
                        value={formData.upi_id || ""}
                        onChange={handleInputChange}
                        placeholder="e.g. name@upi"
                      />
                      {fieldErrors.upi_id && (
                        <div className="invalid-feedback d-block">
                          {fieldErrors.upi_id[0]}
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-medium text-secondary">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        name="bank_name"
                        className={`form-control ${fieldErrors.bank_name ? "is-invalid" : ""}`}
                        value={formData.bank_name || ""}
                        onChange={handleInputChange}
                      />
                      {fieldErrors.bank_name && (
                        <div className="invalid-feedback d-block">
                          {fieldErrors.bank_name[0]}
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-medium text-secondary">
                        Account Number
                      </label>
                      <input
                        type="text"
                        name="bank_account_number"
                        className={`form-control ${fieldErrors.bank_account_number ? "is-invalid" : ""}`}
                        value={formData.bank_account_number || ""}
                        onChange={handleInputChange}
                      />
                      {fieldErrors.bank_account_number && (
                        <div className="invalid-feedback d-block">
                          {fieldErrors.bank_account_number[0]}
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-medium text-secondary">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        name="ifsc_code"
                        className={`form-control ${fieldErrors.ifsc_code ? "is-invalid" : ""}`}
                        value={formData.ifsc_code || ""}
                        onChange={handleInputChange}
                      />
                      {fieldErrors.ifsc_code && (
                        <div className="invalid-feedback d-block">
                          {fieldErrors.ifsc_code[0]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 border-top bg-light flex-shrink-0 rounded-bottom-4">
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-light border px-4"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="riderForm"
                  className="sd-btn-primary px-4 shadow-sm"
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : editingStaff
                      ? "Update Rider"
                      : "Add Rider"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
