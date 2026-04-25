import { useEffect, useMemo, useState } from "react";
import {
  useDeleteAddress,
  useGetAddress,
  useSetDefaultAddress,
} from "../features/useAddress";

export const useAddressBook = () => {
  const { data, isPending } = useGetAddress();
  const { mutate: setDefault, isPending: isSettingDefault } = useSetDefaultAddress();
  const { mutate: deleteAddress, isPending: isDeleting, variables: deletingId, error: deleteError, reset: resetDeleteError } = useDeleteAddress();

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [mapAddressData, setMapAddressData] = useState(null);
  const [orderedIds, setOrderedIds] = useState([]);

  const addresses = data?.addresses || [];

  // Handle Initial Sorting
  useEffect(() => {
    if (addresses.length > 0 && orderedIds.length === 0) {
      const sortedByInitialDefault = [...addresses].sort((a, b) => {
        if (a.is_default && !b.is_default) return -1;
        if (!a.is_default && b.is_default) return 1;
        return 0;
      });
      setOrderedIds(sortedByInitialDefault.map((addr) => addr.id));
    }
  }, [addresses, orderedIds.length]);

  // Compute Display Order
  const displayedAddresses = useMemo(() => {
    if (orderedIds.length === 0) return addresses;
    const addressMap = new Map(addresses.map((addr) => [addr.id, addr]));
    const sorted = orderedIds.map((id) => addressMap.get(id)).filter(Boolean);
    const newAddresses = addresses.filter((addr) => !orderedIds.includes(addr.id));
    return [...sorted, ...newAddresses];
  }, [addresses, orderedIds]);

  // Handlers
  const handleAddNewClick = () => {
    setMapAddressData(null);
    setIsMapOpen(true);
  };

  const handleMapConfirm = (newLocationData) => {
    setMapAddressData((prev) => ({ ...prev, ...newLocationData }));
    setIsMapOpen(false);
    setIsAddressModalOpen(true);
  };

  const handleSwitchToMap = (currentFormValues) => {
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
    setIsAddressModalOpen(false);
    setIsMapOpen(true);
  };

  const handleEditClick = (address) => {
    setMapAddressData(address);
    setIsAddressModalOpen(true);
  };

  const handleDelete = (id) => deleteAddress(id);

  const getAddressIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "home": return "fa-home";
      case "office": return "fa-briefcase";
      default: return "fa-location-dot";
    }
  };

  return {
    isPending,
    displayedAddresses,
    isSettingDefault,
    isDeleting,
    deletingId,
    isMapOpen,
    isAddressModalOpen,
    mapAddressData,
    setIsMapOpen,
    setIsAddressModalOpen,
    handleAddNewClick,
    handleMapConfirm,
    handleSwitchToMap,
    handleEditClick,
    handleDelete,
    getAddressIcon,
    setDefault,
    deleteError,
    resetDeleteError
  };
};
