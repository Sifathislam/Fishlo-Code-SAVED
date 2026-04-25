import { useEffect, useState } from "react";
import { useCreateAddress, useUpdateAddress } from "../features/useAddress";

export default function AddressModal({
  isOpen,
  onClose,
  prefilledData,
  onAddressCreatedOrUpdated,
  shouldValidate,
  onSwitchToMap,
}) {
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null); // New state for backend errors
  const [wasValidated, setWasValidated] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    houseDetails: "",
    addressLine2: "",
    landmark: "",
    state: "",
    pincode: "",
    city: "",
    addressType: "",
    customType: "",
  });

  const isEditMode = !!prefilledData?.id;

  const validate = (dataToValidate = formData) => {
    const newErrors = {};

    // Full Name - Max 50
    if (!dataToValidate.fullName?.trim()) {
      newErrors.fullName = "Please enter your full name";
    } else if (dataToValidate.fullName.length > 50) {
      newErrors.fullName = "Name cannot exceed 50 characters";
    }

    // Phone Number - Validation
    if (!dataToValidate.phoneNumber?.trim()) {
      newErrors.phoneNumber = "Please enter your mobile number";
    } else if (!/^[6-9]\d{9}$/.test(dataToValidate.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid 10-digit mobile number";
    }

    const longWordRegex = /[^\s]{21,}/;
    if (longWordRegex.test(formData.houseDetails)) {
      newErrors.houseDetails = "Individual words cannot exceed 20 characters.";
    }

    // Address Line 1 - Max 250
    if (!dataToValidate.houseDetails?.trim()) {
      newErrors.houseDetails = "Please enter your address";
    } else if (dataToValidate.houseDetails.length > 250) {
      newErrors.houseDetails = "Address cannot exceed 250 characters";
    }

    // Address Line 2 - Max 250
    if (!dataToValidate.addressLine2?.trim()) {
      newErrors.addressLine2 = "Please enter street details";
    } else if (dataToValidate.addressLine2.length > 250) {
      newErrors.addressLine2 = "Address line 2 cannot exceed 250 characters";
    }

    // State - Max 50
    if (!dataToValidate.state?.trim()) {
      newErrors.state = "Please enter your state";
    } else if (dataToValidate.state.length > 50) {
      newErrors.state = "State name is too long";
    }

    // City - Max 50
    if (!dataToValidate.city?.trim()) {
      newErrors.city = "Please enter your city";
    } else if (dataToValidate.city.length > 50) {
      newErrors.city = "City name is too long";
    }

    // Pincode - Validation
    if (!dataToValidate.pincode?.trim()) {
      newErrors.pincode = "Please enter pincode";
    } else if (!/^\d{6}$/.test(dataToValidate.pincode)) {
      newErrors.pincode = "Please enter a valid 6-digit pincode";
    }

    // Landmark - Max 250
    if (dataToValidate.landmark && dataToValidate.landmark.length > 250) {
      newErrors.landmark = "Landmark cannot exceed 250 characters";
    }

    if (!dataToValidate.addressType) {
      newErrors.addressType =
        "Please select an address type (Home, Office, or Other)";
    }

    // Custom Type - Required if 'Other' & Max 50
    if (dataToValidate.addressType === "Other") {
      if (!dataToValidate.customType?.trim()) {
        newErrors.customType = "Please specify the address type";
      } else if (dataToValidate.customType.length > 50) {
        newErrors.customType = "Custom type cannot exceed 50 characters";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setServerError(null);
      setWasValidated(false);
    }
  }, [isOpen]);

  // Focus the first invalid field whenever errors are updated
  useEffect(() => {
    // Only auto-focus if we just performed a validation (clicked submit)
    if (wasValidated) {
      const errorKeys = Object.keys(errors);
      if (errorKeys.length > 0) {
        const firstErrorKey = errorKeys[0];
        const element = document.querySelector(`[name="${firstErrorKey}"]`);
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      // Reset the trigger so it doesn't focus again until the next submit
      setWasValidated(false);
    }
  }, [errors, wasValidated]);

  useEffect(() => {
    if (prefilledData && isOpen) {
      const capitalize = (s) =>
        s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

      // Create a local object with all the mapped data
      const updatedData = {
        fullName: prefilledData?.recipient_name || "",
        phoneNumber: prefilledData?.recipient_phone || "",
        houseDetails: prefilledData?.house_details || "",
        addressLine2: prefilledData?.address_line_2 || "",
        landmark: prefilledData?.landmark || "",
        state: prefilledData?.state || "",
        pincode: prefilledData?.postal_code || "",
        city: prefilledData?.city || "",
        addressType: capitalize(prefilledData?.address_type),
        customType: prefilledData?.address_type_other || "",
      };

      setFormData(updatedData);

      if (shouldValidate) {
        validate(updatedData);
        setWasValidated(true);
      }
    }
  }, [prefilledData, isOpen, shouldValidate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prevErrors) => {
        const updatedErrors = { ...prevErrors };
        delete updatedErrors[name]; // This makes the error vanish
        return updatedErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null); // Clear previous server errors

    if (validate()) {
      const payload = {
        recipient_name: formData.fullName.trim(),
        recipient_phone: formData.phoneNumber.trim(),
        house_details: formData.houseDetails.trim(),
        address_line_2: formData.addressLine2.trim(),
        landmark: formData.landmark.trim(),
        state: formData.state.trim(),
        city: formData.city.trim(),
        postal_code: formData.pincode.trim(),
        address_type: formData.addressType.toLowerCase(),
        address_type_other:
          formData.addressType === "Other" ? formData.customType : null,
        latitude: prefilledData?.latitude || null,
        longitude: prefilledData?.longitude || null,
      };

      if (isEditMode) {
        updateAddressMutation.mutate(
          { id: prefilledData.id, data: payload },
          {
            onSuccess: () => {
              onAddressCreatedOrUpdated(prefilledData.id);
              onClose();
            },
            onError: (err) => {
              setServerError(
                err.response?.data?.message ||
                  err.response?.data?.detail ||
                  "Failed to update address",
              );
            },
          },
        );
      } else {
        createAddressMutation.mutate(payload, {
          onSuccess: (response) => {
            const newId = response?.data?.id || response?.id;
            if (newId) onAddressCreatedOrUpdated(newId);
            onClose();
          },
          onError: (error) => {
            setServerError(
              error.response?.data?.message ||
                error.response?.data?.detail ||
                "Failed to create address",
            );
          },
        });
      }
    }
  };

  if (!isOpen) return null;

  const isSubmitting =
    createAddressMutation.isPending || updateAddressMutation.isPending;

  const isFieldLocked = (value) => !!value && value.trim() !== "";

  const renderSecureField = (label, name, value, canEdit = true) => {
    const locked = isFieldLocked(value) && !canEdit;

    return (
      <div className="form-floating-custom">
        <div className="d-flex justify-content-between align-items-center">
          <label>{label}</label>
          {name === "addressLine2" && locked && (
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-decoration-none"
              onClick={() => onSwitchToMap(formData)}
              style={{ fontSize: "12px", color: "#d7574c" }}
            >
             Change on map <i className="bi bi-pencil" style={{ fontSize: "16px" }}></i>
            </button>
          )}
        </div>
        {locked ? (
          <div
            className="form-control bg-light text-muted"
            style={{ cursor: "not-allowed", border: "1px solid #dee2e6" }}
          >
            {value}
          </div>
        ) : (
          <input
            type="text"
            name={name}
            className="form-control"
            value={formData[name]}
            onChange={handleChange}
            maxLength={name === "pincode" ? "6" : "250"}
          />
        )}
      </div>
    );
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg modal-fullscreen-sm-down">
        <div
          className="modal-content border-0 shadow-lg"
          style={{ borderRadius: "16px" }}
        >
          <div className="modal-header border-bottom-0 pb-0 px-4 pt-4">
            <div>
              <h5 className="modal-title fw-medium">
                {isEditMode ? "Edit Address" : "Add New Address"}
              </h5>
              <p className="text-muted small m-0">
                Please fill in your delivery details
              </p>
              {/* Show Server Errors Here */}
              {serverError && (
                <div className="alert alert-danger py-2 mt-2 mb-0 small">
                  {serverError}
                </div>
              )}
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body px-4 pt-4 pb-2">
            <form id="address-form" className="row g-3" onSubmit={handleSubmit}>
              <div className="col-12">
                <h6 className="text-fishlo fw-medium small text-uppercase mb-0 mt-2">
                  Contact Details
                </h6>
              </div>

              <div className="col-md-6">
                <div className="form-floating-custom">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    className="form-control"
                    placeholder="Enter name"
                    maxLength="50"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                  {errors.fullName && (
                    <div className="text-danger small">{errors.fullName}</div>
                  )}
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-floating-custom">
                  <label>Contact Number</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      +91
                    </span>
                    <input
                      type="text"
                      name="phoneNumber"
                      className="form-control border-start-0"
                      placeholder="Enter contact number"
                      maxLength="10"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.phoneNumber && (
                    <div className="text-danger small mt-1">
                      {errors.phoneNumber}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-12 mt-4">
                <h6 className="text-fishlo fw-medium small text-uppercase mb-0">
                  Address Details
                </h6>
              </div>

              <div className="col-12">
                <div className="col-12">
                  {renderSecureField(
                    "Location*",
                    "addressLine2",
                    prefilledData?.address_line_2,
                    false,
                  )}
                  {errors.addressLine2 && (
                    <div className="text-danger small mt-1">
                      {errors.addressLine2}
                    </div>
                  )}
                </div>
                {errors.addressLine2 && (
                  <div className="text-danger small mt-1">
                    {errors.addressLine2}
                  </div>
                )}
              </div>

              <div className="col-12">
                <div className="form-floating-custom">
                  <label>Flat, House no., Building, Company, Apartment*</label>
                  <input
                    type="text"
                    name="houseDetails"
                    className="form-control"
                    maxLength="250"
                    value={formData.houseDetails}
                    onChange={handleChange}
                  />
                </div>
                {errors.houseDetails && (
                  <div className="text-danger small mt-1">
                    {errors.houseDetails}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <div className="form-floating-custom">
                  <label>Landmark (Optional)</label>
                  <input
                    type="text"
                    name="landmark"
                    className="form-control"
                    maxLength="250"
                    placeholder="E.g. Near Apollo Hospital"
                    value={formData.landmark}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="col-md-6">
                {renderSecureField(
                  "State*",
                  "state",
                  prefilledData?.state,
                  false,
                )}
                {errors.state && (
                  <div className="text-danger small mt-1">{errors.state}</div>
                )}
                {errors.state && (
                  <div className="text-danger small mt-1">{errors.state}</div>
                )}
              </div>

              <div className="col-6">
                <div className="form-floating-custom">
                  <label>Pincode*</label>
                  <input
                    type="text"
                    name="pincode"
                    className="form-control"
                    maxLength="6"
                    value={formData.pincode}
                    onChange={handleChange}
                  />
                </div>
                {errors.pincode && (
                  <div className="text-danger small mt-1">{errors.pincode}</div>
                )}
              </div>

              <div className="col-6">
                {renderSecureField(
                  "City / District*",
                  "city",
                  prefilledData?.city,
                  false,
                )}
                {errors.city && (
                  <div className="text-danger small mt-1">{errors.city}</div>
                )}
              </div>

              <div className="col-12 mt-4">
                <label className="form-label small text-muted fw-medium">
                  SAVE ADDRESS AS
                </label>
                <div className="d-flex gap-2">
                  {["Home", "Office", "Other"].map((type) => (
                    <div key={type}>
                      <input
                        type="radio"
                        className="btn-check"
                        name="addressType" // Added name attribute
                        id={`type${type}`}
                        checked={formData.addressType === type}
                        onChange={() => {
                          setFormData((p) => ({ ...p, addressType: type }));
                          // Clear error when a type is selected
                          if (errors.addressType) {
                            setErrors((prev) => {
                              const { addressType, ...rest } = prev;
                              return rest;
                            });
                          }
                        }}
                      />
                      <label
                        className={`btn ${
                          errors.addressType
                            ? "btn-outline-danger"
                            : "btn-outline-light"
                        } text-dark border fw-medium px-3`}
                        htmlFor={`type${type}`}
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.addressType && (
                  <div className="text-danger small mt-1">
                    {errors.addressType}
                  </div>
                )}
              </div>

              {formData.addressType === "Other" && (
                <div className="col-12 animate__animated animate__fadeIn">
                  <div className="form-floating-custom">
                    <label>Specify Address Name </label>
                    <input
                      type="text"
                      name="customType"
                      className="form-control"
                      placeholder="e.g. Gym, Studio"
                      maxLength="50"
                      autoFocus
                      value={formData.customType}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.customType && (
                    <div className="text-danger small mt-1">
                      {errors.customType}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          <div className="modal-footer border-top-0 px-4 pb-4">
            <button
              type="submit"
              form="address-form"
              className="btn btn-fishlo px-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  {isEditMode ? "Updating..." : "Saving..."}
                </>
              ) : (
                <>{isEditMode ? "Update Address" : "Save & Continue"}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
