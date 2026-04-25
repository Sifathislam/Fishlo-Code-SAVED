import { useEffect, useMemo, useState } from "react";
import {
  useCreateAddress,
  useGetAddress,
  useUpdateAddress,
} from "../features/useAddress"; // Adjust path as needed

const DEFAULT_CENTER = { lat: 19.0845, lng: 73.0084 };

export const useLocationManager = () => {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState({
    id: null,
    formatted: "",
    lat: null,
    lng: null,
  });

  const { data: addressData, isLoading: isLoadingAddress } = useGetAddress();
  const { mutate: updateAddress, isPending: isUpdatingAddress, error } = useUpdateAddress();
  const { mutate: createAddress, isPending: isSavingAddress } = useCreateAddress();


  // Automatically select default or first address when data loads
  // Reset to empty when addresses are cleared (e.g. after logout)
  useEffect(() => {
    if (addressData?.addresses?.length > 0) {
      const targetAddr = addressData.addresses.find((addr) => addr.is_default) || addressData.addresses[0];

      if (targetAddr) {
        setSelectedAddress({
          id: targetAddr.id,
          formatted: targetAddr.address_line_2 || `${targetAddr.city}, ${targetAddr.postal_code}`,
          lat: parseFloat(targetAddr.latitude),
          lng: parseFloat(targetAddr.longitude),
        });
      }
    } else {
      // No addresses available (logged out or no saved addresses) — reset
      setSelectedAddress({ id: null, formatted: "", lat: null, lng: null });
    }
  }, [addressData]);

  // Memoized map center for Google Maps integration
  const mapCenter = useMemo(() => {
    if (selectedAddress?.lat && selectedAddress?.lng) {
      return {
        lat: parseFloat(selectedAddress.lat),
        lng: parseFloat(selectedAddress.lng),
      };
    }
    return DEFAULT_CENTER;
  }, [selectedAddress]);

  // Handler for saving/updating
  const handleLocationConfirm = (locationData) => {
    // Optimistic Update
    setSelectedAddress((prev) => ({
      ...prev,
      formatted: locationData.address_line_2,
      lat: locationData.latitude,
      lng: locationData.longitude,
    }));

    if (selectedAddress.id) {
      updateAddress({ id: selectedAddress.id, data: locationData });
    } else {
      createAddress(locationData);
    }

    setShowLocationModal(false);
  };

  return {
    selectedAddress,
    showLocationModal,
    setShowLocationModal,
    isLoadingAddress,
    isProcessing: isUpdatingAddress || isSavingAddress,
    mapCenter,
    handleLocationConfirm,
  };
};
