import React, { useState, useEffect } from "react";
import {
  useStaffDetail,
  useCreateStaff,
  useUpdateStaff,
} from "../../../features/useStoreStaff";

const GENDERS = ["Male", "Female", "Other"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export default function StaffModal({ editingStaff, onClose, choicesData }) {
  const [formData, setFormData] = useState({});
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();

  // Detail fetch for editing
  const { data: staffDetail } = useStaffDetail(editingStaff?.id, {
    enabled: !!editingStaff?.id,
  });

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      password: "Staff@123",
      role: "Staff",
      status: "Active",
      shift_timing: "Full Time",
      joining_date: new Date().toISOString().split("T")[0],
      dob: "",
      gender: "Male",
      blood_group: "O+",
      current_address: "",
      permanent_address: "",
      emergency_contact: "",
      salary: 0,
      bank_name: "",
      bank_account_number: "",
      ifsc_code: "",
      account_holder_name: "",
    });
  };

  // Single unified effect: populate form from staffDetail (edit) or reset (create)
  useEffect(() => {
    if (editingStaff) {
      if (staffDetail) {
        // Full detail has loaded — populate ALL fields including payroll
        setFormData({
          first_name: staffDetail.first_name || "",
          last_name: staffDetail.last_name || "",
          email: staffDetail.email || "",
          phone_number: staffDetail.phone_number || "",
          role: staffDetail.role || "Staff",
          status: staffDetail.status || "Active",
          joining_date: staffDetail.joining_date || "",
          shift_timing: staffDetail.shift_timing || "Full Time",
          dob: staffDetail.dob || "",
          gender: staffDetail.gender || "Male",
          blood_group: staffDetail.blood_group || "O+",
          current_address: staffDetail.current_address || "",
          permanent_address: staffDetail.permanent_address || "",
          emergency_contact: staffDetail.emergency_contact || "",
          salary: staffDetail.salary ?? 0,
          bank_name: staffDetail.bank_name || "",
          bank_account_number: staffDetail.bank_account_number || "",
          ifsc_code: staffDetail.ifsc_code || "",
          account_holder_name: staffDetail.account_holder_name || "",
        });
      } else {
        // Detail not yet loaded — set only the basic fields from list data as a placeholder
        setFormData((prev) => ({
          ...prev,
          first_name: editingStaff.name.full_name.split(" ")[0] || "",
          last_name:
            editingStaff.name.full_name.split(" ").slice(1).join(" ") || "",
          email: editingStaff.name.email || "",
          phone_number: editingStaff.contact || "",
          role: editingStaff.role || "Staff",
          status: editingStaff.status || "Active",
          joining_date: editingStaff.joined
            ? editingStaff.joined.split("-").reverse().join("-")
            : "",
          // Preserve payroll fields as empty defaults until detail loads
          salary: prev.salary ?? 0,
          bank_name: prev.bank_name || "",
          bank_account_number: prev.bank_account_number || "",
          ifsc_code: prev.ifsc_code || "",
          account_holder_name: prev.account_holder_name || "",
        }));
      }
    } else {
      resetForm();
    }
  }, [editingStaff, staffDetail]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    setFormError(null);
    setFieldErrors({});

    const submitData = { ...formData };
    // Ensure salary is a valid number (input type=number returns string)
    submitData.salary = parseFloat(submitData.salary) || 0;

    if (editingStaff) {
      if (!submitData.password) delete submitData.password;

      updateStaff.mutate(
        { id: editingStaff.id, ...submitData },
        {
          onSuccess: () => onClose(),
          onError: (err) => {
            const errorData = err.response?.data;
            setFieldErrors(errorData || {});
            setFormError(
              err.response?.data?.detail || "Failed to update staff member"
            );
          },
        }
      );
    } else {
      createStaff.mutate(submitData, {
        onSuccess: () => onClose(),
        onError: (err) => {
          const errorData = err.response?.data;
          setFieldErrors(errorData || {});
          setFormError(
            err.response?.data?.detail || "Failed to create staff member"
          );
        },
      });
    }
  };

  return (
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
              {editingStaff ? "Edit Staff Member" : "Add New Staff"}
            </h5>
            <p className="small text-muted mb-0">
              Enter the details for your team member
            </p>
          </div>
          <button className="btn-close" onClick={onClose}></button>
        </div>
        {formError && (
          <div className="px-4 pt-3">
            <div className="alert alert-danger mb-0 small py-2">
              {formError}
            </div>
          </div>
        )}
        <div className="p-4" style={{ overflowY: "auto" }}>
          <form id="staffForm" onSubmit={handleSubmit}>
            <div className="mb-4">
              <h6 className="fw-medium text-uppercase small text-muted ls-1 mb-3 border-bottom pb-2">
                Professional Details
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
                    className={`form-control ${fieldErrors.first_name ? "is-invalid" : ""
                      }`}
                    value={formData.first_name || ""}
                    onChange={handleInputChange}
                    maxLength="50"
                  />
                  {fieldErrors.first_name && (
                    <div className="invalid-feedback">
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
                    className={`form-control ${fieldErrors.last_name ? "is-invalid" : ""
                      }`}
                    value={formData.last_name || ""}
                    onChange={handleInputChange}
                    maxLength="50"
                  />
                  {fieldErrors.last_name && (
                    <div className="invalid-feedback">
                      {fieldErrors.last_name[0]}
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-medium text-secondary">
                    Role <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="role"
                    value={formData.role || ""}
                    onChange={handleInputChange}
                  >
                    {choicesData?.roles?.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-medium text-secondary">
                    Shift Timing
                  </label>
                  <select
                    className="form-select"
                    name="shift_timing"
                    value={formData.shift_timing || ""}
                    onChange={handleInputChange}
                  >
                    {choicesData?.shifts?.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-medium text-secondary">
                    Status
                  </label>
                  <select
                    className="form-select"
                    name="status"
                    value={formData.status || ""}
                    onChange={handleInputChange}
                  >
                    {choicesData?.statuses?.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <h6 className="fw-medium text-uppercase small text-muted ls-1 mb-3 border-bottom pb-2">
                Contact & Personal Info
              </h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-medium text-secondary">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    className={`form-control ${fieldErrors.email ? "is-invalid" : ""
                      }`}
                    value={formData.email || ""}
                    onChange={handleInputChange}
                    maxLength="254"
                  />
                  {fieldErrors.email && (
                    <div className="invalid-feedback">
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
                    name="phone_number"
                    className={`form-control ${fieldErrors.phone_number ? "is-invalid" : ""
                      }`}
                    value={formData.phone_number || ""}
                    onChange={handleInputChange}
                    maxLength="15"
                    minLength="10"
                    pattern="[0-9\-\+\s]+"
                    title="Please enter a valid phone number"
                  />
                  {fieldErrors.phone_number && (
                    <div className="invalid-feedback">
                      {fieldErrors.phone_number[0]}
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-medium text-secondary">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    className="form-control"
                    value={formData.dob || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-medium text-secondary">
                    Gender
                  </label>
                  <select
                    className="form-select"
                    name="gender"
                    value={formData.gender || ""}
                    onChange={handleInputChange}
                  >
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-medium text-secondary">
                    Blood Group
                  </label>
                  <select
                    className="form-select"
                    name="blood_group"
                    value={formData.blood_group || ""}
                    onChange={handleInputChange}
                  >
                    {BLOOD_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                {!editingStaff && (
                  <div className="col-md-6">
                    <label className="form-label small fw-medium text-secondary">
                      Password <span className="text-danger">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      name="password"
                      className={`form-control bg-light ${fieldErrors.password ? "is-invalid" : ""
                        }`}
                      value={formData.password || ""}
                      readOnly
                    />
                    {fieldErrors.password && (
                      <div className="invalid-feedback">
                        {fieldErrors.password[0]}
                      </div>
                    )}
                  </div>
                )}
                <div className="col-md-12">
                  <label className="form-label small fw-medium text-secondary">
                    Current Address
                  </label>
                  <textarea
                    name="current_address"
                    className="form-control"
                    rows="2"
                    value={formData.current_address || ""}
                    onChange={handleInputChange}
                    maxLength="500"
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <h6 className="fw-medium text-uppercase small text-muted ls-1 mb-3 border-bottom pb-2">
                Legal & Emergency
              </h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-medium text-secondary">
                    Emergency Contact
                  </label>
                  <input
                    type="tel"
                    name="emergency_contact"
                    className="form-control"
                    value={formData.emergency_contact || ""}
                    onChange={handleInputChange}
                    maxLength="15"
                    minLength="10"
                    pattern="[0-9\-\+\s]*"
                    title="Please enter a valid emergency contact number"
                  />
                </div>
              </div>
            </div>
            <div>
              <h6 className="fw-medium text-uppercase small text-muted ls-1 mb-3 border-bottom pb-2">
                Payroll Details
              </h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-medium text-secondary">
                    Monthly Salary (₹)
                  </label>
                  <input
                    type="number"
                    name="salary"
                    className="form-control"
                    value={formData.salary || 0}
                    onChange={handleInputChange}
                    min="0"
                    max="9999999"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-medium text-secondary">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bank_name"
                    className="form-control"
                    value={formData.bank_name || ""}
                    onChange={handleInputChange}
                    maxLength="100"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-medium text-secondary">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="bank_account_number"
                    className="form-control"
                    value={formData.bank_account_number || ""}
                    onChange={handleInputChange}
                    maxLength="30"
                    pattern="[0-9]*"
                    title="Please enter a valid account number (digits only)"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-medium text-secondary">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    name="ifsc_code"
                    className="form-control"
                    value={formData.ifsc_code || ""}
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase();
                      handleInputChange(e);
                    }}
                    maxLength="11"
                    pattern="^[A-Z]{4}0[A-Z0-9]{6}$|^$"
                    title="Please enter a valid 11-character IFSC code (e.g., SBIN0001234)"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-medium text-secondary">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    name="account_holder_name"
                    className="form-control"
                    value={formData.account_holder_name || ""}
                    onChange={handleInputChange}
                    maxLength="100"
                  />
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
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="staffForm"
              className="sd-btn-primary px-4 shadow-sm"
              disabled={createStaff.isPending || updateStaff.isPending}
            >
              {createStaff.isPending || updateStaff.isPending
                ? "Saving..."
                : editingStaff
                  ? "Update Member"
                  : "Add Member"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
