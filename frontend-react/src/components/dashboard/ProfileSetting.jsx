import { useEffect, useRef, useState } from "react";
import { useUpdateProfile } from "../../features/useGetDashboard"; // Double check if this import path is correct
import { useGetProfile } from "../../features/useGetProfile";
import Loader from "../../shared/components/Loader";

export default function ProfileSettings() {
  const { data, isLoading } = useGetProfile();
  const updateMutation = useUpdateProfile();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // Separate state for preview
  const [errors, setErrors] = useState({});

  const serverErrors = updateMutation.error?.response?.data;

  useEffect(() => {
    if (data) {
      setFormData({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
      });
    }
  }, [data]);

  // Handle image preview and memory cleanup
  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setPreviewUrl(objectUrl);

    // Cleanup function to free memory when component unmounts or image changes
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    } else if (formData.first_name.length > 30) {
      newErrors.first_name = "First name cannot exceed 30 characters";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    } else if (formData.last_name.length > 30) {
      newErrors.last_name = "Last name cannot exceed 30 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (formData.email.length > 254) {
      newErrors.email = "Email is too long (max 32 characters)";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear specific error when user starts typing again
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleCancel = () => {
    // Reset form to original data
    if (data) {
      setFormData({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
      });
      setSelectedImage(null);
      setErrors({});
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const submissionData = new FormData();
    submissionData.append("first_name", formData.first_name);
    submissionData.append("last_name", formData.last_name);
    submissionData.append("email", formData.email);

    if (selectedImage) {
      submissionData.append("profile_image", selectedImage);
    }

    updateMutation.mutate(submissionData, {
      onSuccess: () => {
        setErrors({});
        setSelectedImage(null);
      },
      onError: (error) => {
        console.error("Profile update error:", error);
      }
    });
  };

  if (isLoading)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px", width: "100%" }}
      >
        <Loader />
      </div>
    );

  const isDirty =
    formData.first_name !== (data?.first_name || "") ||
    formData.last_name !== (data?.last_name || "") ||
    formData.email !== (data?.email || "") ||
    selectedImage !== null;

  const initials =
    data?.first_name && data?.last_name ? (
      `${data.first_name[0]}${data.last_name[0]}`.toUpperCase()
    ) : (
      <i className="fas fa-user text-primary"></i>
    );

  return (
    <div className="fade-in">
      <title>Profile Settings | Fishlo</title>
      <div className="card-custom">
        <h4 className="fw-medium mb-4">Account Settings</h4>

        <div className="d-flex align-items-center mb-4">
          <div className="position-relative me-3">
            <div
              className="bg-light rounded-circle d-flex align-items-center justify-content-center text-muted fw-medium border overflow-hidden"
              style={{ width: "70px", height: "70px", fontSize: "1.5rem" }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  className="w-100 h-100 object-fit-conatain"
                  alt="Preview"
                />
              ) : data?.profile_image ? (
                <img
                  src={data.profile_image}
                  className="w-100 h-100 object-fit-cover"
                  alt="Profile"
                />
              ) : (
                initials
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="d-none"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="btn btn-sm btn-dark position-absolute bottom-0 end-0 rounded-circle p-0 d-flex align-items-center justify-content-center"
              style={{ width: "24px", height: "24px" }}
            >
              <i className="fas fa-camera" style={{ fontSize: "0.7rem" }}></i>
            </button>
          </div>
          <div>
            <h6 className="fw-medium mb-0">Profile Picture</h6>
            <small className="text-muted">PNG, JPG up to 5MB</small>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-3 mb-4">
            {/* First Name */}
            <div className="col-md-6">
              <label className="form-label small fw-medium text-muted text-uppercase">
                First Name
              </label>
              <input
                name="first_name"
                type="text"
                // maxLength={30}
                className={`form-control dashboard-form-control form-control-lg fs-6 ${errors.first_name ? "is-invalid" : ""}`}
                value={formData.first_name}
                onChange={handleChange}
              />
              <div className="invalid-feedback">{errors.first_name}</div>
            </div>

            {/* Last Name */}
            <div className="col-md-6">
              <label className="form-label small fw-medium text-muted text-uppercase">
                Last Name
              </label>
              <input
                name="last_name"
                type="text"
                maxLength={30}
                className={`form-control dashboard-form-control form-control-lg fs-6 ${errors.last_name ? "is-invalid" : ""}`}
                value={formData.last_name}
                onChange={handleChange}
              />
              <div className="invalid-feedback">{errors.last_name}</div>
            </div>

            {/* Email */}
            <div className="col-md-6">
              <label className="form-label small fw-medium text-muted text-uppercase">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                maxLength={32}
                className={`form-control dashboard-form-control form-control-lg fs-6 ${errors.email || serverErrors?.email ? "is-invalid" : ""}`}
                value={formData.email}
                onChange={handleChange}
              />
              <div className="invalid-feedback">
                {errors.email || (serverErrors?.email && serverErrors.email[0])}
              </div>
            </div>

            {/* Phone (Disabled) */}
            <div className="col-md-6">
              <label className="form-label small fw-medium text-muted text-uppercase">
                Phone
              </label>
              <input
                type="tel"
                className="form-control form-control-lg fs-6"
                defaultValue={data?.phone_number || ""}
                disabled
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-5">
            <button
              type="button"
              className="btn btn-outline-secondary px-4"
              onClick={handleCancel}
              disabled={!isDirty || updateMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-brand px-4 d-flex align-items-center"
              disabled={!isDirty || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
