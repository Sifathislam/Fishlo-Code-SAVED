import { useState } from "react";

export const useAddressWorkflow = () => {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [mapAddressData, setMapAddressData] = useState(null);
  const [autoValidate, setAutoValidate] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const handleAddNewClick = () => {
    setMapAddressData(null);
    setIsMapOpen(true);
  };

  const handleMapConfirm = (newLocationData) => {
    setMapAddressData((prev) => ({
      ...prev, // Keep existing ID, recipient_name, recipient_phone
      ...newLocationData, // Overwrite with new lat, lng, and address lines
    }));
    setIsMapOpen(false);
    setIsAddressModalOpen(true);
    setAutoValidate(false);
  };

  const handleEditClick = (address, triggerValidation = false) => {
    setMapAddressData(address);
    setAutoValidate(triggerValidation);
    setIsAddressModalOpen(true);
  };

  const switchToMapMode = (currentFormValues) => {
    // Save what the user typed into the "prefilled" state
    setMapAddressData((prev) => ({
      ...prev,
      recipient_name: currentFormValues.fullName,
      recipient_phone: currentFormValues.phoneNumber,
      house_details: currentFormValues.houseDetails,
      address_line_2: currentFormValues.addressLine2,
      landmark: currentFormValues.landmark,
      state: currentFormValues.state,
      city: currentFormValues.city,
      postal_code: currentFormValues.pincode,
      address_type: currentFormValues.addressType,
      address_type_other: currentFormValues.customType,
    }));
    
    // Toggle the modals
    setIsAddressModalOpen(false);
    setIsMapOpen(true);
  };

  return {
    state: {
      isMapOpen,
      isAddressModalOpen,
      mapAddressData,
      autoValidate,
      selectedAddressId,
    },
    actions: {
      setIsMapOpen,
      setIsAddressModalOpen,
      setMapAddressData,
      setAutoValidate,
      setSelectedAddressId,
      handleAddNewClick,
      handleMapConfirm,
      handleEditClick,
      switchToMapMode,
    },
  };
};
