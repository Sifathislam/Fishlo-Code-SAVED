export const validateAddress = (data, isBilling = false) => {
  const errors = {};
  const phoneRegex = /^[6-9]\d{9}$/;
  const zipRegex = /^\d{6}$/;

  // Map backend field names to display names for generic logic if needed
  if (!data.recipient_name?.trim() && !data.full_name?.trim())
    errors.fullName = "Full name is required";

  if (!data.recipient_phone?.trim() && !data.phone?.trim()) {
    errors.phoneNumber = "Phone number is required";
  } else if (!phoneRegex.test(data.recipient_phone || data.phone)) {
    errors.phoneNumber = "Enter a valid 10-digit number";
  }

  if (!data.house_details?.trim())
    errors.addressLine1 = "Address line 1 is required";
  if (!data.city?.trim()) errors.city = "City is required";
  if (!data.state?.trim()) errors.state = "State is required";

  if (!data.postal_code?.trim() && !data.zip_code?.trim()) {
    errors.pincode = "Pincode is required";
  } else if (!zipRegex.test(data.postal_code || data.zip_code)) {
    errors.pincode = "Enter a valid 6-digit pincode";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
