import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChangePassword } from "../../features/useDeliveryAssignment";

const DeliveryChangePassword = () => {
  const navigate = useNavigate();
  const changePasswordMutation = useChangePassword();

  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: null });
    }
    setGeneralError("");
    setSuccessMsg("");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError("");

    let isValid = true;
    const errors = {};
    const pw = passwordForm.new_password;

    if (pw.length < 8 || !/[A-Z]/.test(pw) || !/\d/.test(pw)) {
      errors.new_password = ["Please meet all the password requirements listed below."];
      isValid = false;
    }
    
    if (pw !== passwordForm.confirm_password) {
      errors.confirm_password = ["The new password and confirmation password do not match."];
      isValid = false;
    }

    if (!isValid) {
      setFieldErrors(errors);
      return;
    }

    changePasswordMutation.mutate(
      {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            setSuccessMsg("Password updated successfully. Redirecting...");
            setPasswordForm({ old_password: "", new_password: "", confirm_password: "" });
            setTimeout(() => {
              navigate("/delivery/profile");
            }, 1500);
          } else {
            setGeneralError(data.message || "Something went wrong while updating your password. Please try again.");
          }
        },
        onError: (err) => {
          const apiErrors = err.response?.data?.errors;
          if (apiErrors) {
            // Ensure apiErrors are mapped correctly to arrays for our UI
            const formattedErrors = {};
            for (const key in apiErrors) {
              formattedErrors[key] = Array.isArray(apiErrors[key]) ? apiErrors[key] : [apiErrors[key]];
              
              // Custom map for DRF generic 'Old password is not correct.'
              if (formattedErrors[key][0] === "Old password is not correct.") {
                formattedErrors[key] = ["The current password you entered is incorrect."];
              }
            }
            setFieldErrors(formattedErrors);
          } else {
            setGeneralError(err.response?.data?.message || "Failed to connect to the server. Please check your internet connection and try again.");
          }
        },
      }
    );
  };

  return (
    <div className="delivery-profile-wrapper">
      <div className="profile-header-section glass-effect" style={{ height: "120px", display: "flex", alignItems: "flex-end", paddingBottom: "20px" }}>
        <div style={{ width: "100%", display: "flex", alignItems: "center", padding: "0 20px" }}>
          <button className="btn btn-sm btn-light rounded-circle shadow-sm" style={{ width: "36px", height: "36px", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => navigate(-1)}>
            <i className="fa fa-arrow-left"></i>
          </button>
          <h4 className="mb-0 font-weight-bold" style={{ marginLeft: "15px", zIndex: 10, color: "#d7574c" }}>Change Password</h4>
        </div>
      </div>

      <div className="delivery-card" style={{ margin: "-20px 15px 20px", position: "relative", zIndex: 5, padding: "20px" }}>
        {successMsg && <div className="alert alert-success p-2 small">{successMsg}</div>}
        {generalError && <div className="alert alert-danger p-2 small">{generalError}</div>}

        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group mb-3">
            <label className="small text-muted mb-1 font-weight-bold">Current Password</label>
            <input
              type="password"
              name="old_password"
              className={`form-control ${fieldErrors.old_password ? 'is-invalid' : ''}`}
              value={passwordForm.old_password}
              onChange={handlePasswordChange}
              required
              placeholder="Enter current password"
            />
            {fieldErrors.old_password && (
              <div className="invalid-feedback d-block mt-1">
                {fieldErrors.old_password[0]}
              </div>
            )}
          </div>

          <div className="form-group mb-3">
            <label className="small text-muted mb-1 font-weight-bold">New Password</label>
            <input
              type="password"
              name="new_password"
              className={`form-control ${fieldErrors.new_password ? 'is-invalid' : ''}`}
              value={passwordForm.new_password}
              onChange={handlePasswordChange}
              required
              placeholder="Enter new password"
            />
            {fieldErrors.new_password && (
              <div className="invalid-feedback d-block mt-1">
                {fieldErrors.new_password[0]}
              </div>
            )}
            
            {/* Password Requirements UI */}
            <div className="mt-2 pl-1 small" style={{ lineHeight: "1.6" }}>
              <div style={{ color: passwordForm.new_password.length >= 8 ? "green" : "#6c757d" }}>
                 <i className={`fa ${passwordForm.new_password.length >= 8 ? "fa-check-circle" : "fa-circle-o"} mr-1`}></i> Minimum 8 characters
              </div>
              <div style={{ color: /[A-Z]/.test(passwordForm.new_password) ? "green" : "#6c757d" }}>
                 <i className={`fa ${/[A-Z]/.test(passwordForm.new_password) ? "fa-check-circle" : "fa-circle-o"} mr-1`}></i> At least 1 uppercase letter
              </div>
              <div style={{ color: /\d/.test(passwordForm.new_password) ? "green" : "#6c757d" }}>
                 <i className={`fa ${/\d/.test(passwordForm.new_password) ? "fa-check-circle" : "fa-circle-o"} mr-1`}></i> At least 1 number
              </div>
            </div>
          </div>

          <div className="form-group mb-4">
            <label className="small text-muted mb-1 font-weight-bold">Confirm New Password</label>
            <input
              type="password"
              name="confirm_password"
              className={`form-control ${fieldErrors.confirm_password ? 'is-invalid' : ''}`}
              value={passwordForm.confirm_password}
              onChange={handlePasswordChange}
              required
              placeholder="Confirm new password"
            />
            {fieldErrors.confirm_password && (
              <div className="invalid-feedback d-block mt-1">
                {fieldErrors.confirm_password[0]}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="delivery-btn w-100"
            disabled={changePasswordMutation.isPending}
            style={{ backgroundColor: "#d7574c", color: "white", display: "flex", justifyContent: "center", alignItems: "center" }}
          >
            {changePasswordMutation.isPending ? (
              <><span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span> Updating...</>
            ) : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DeliveryChangePassword;
