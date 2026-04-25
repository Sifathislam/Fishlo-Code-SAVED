import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFishloMasalaProducts } from "../../features/useGetMasala";
import Addons from "./Addons";
import AddressCard from "./AddressCard";
import AddressSelectionModal from "./AddressSelectionModal";
import BillingAddress from "./BillingAddress";
import CheckoutAddressSkeleton from "./CheckoutAddressSkeleton";
import DeliverySlotSelection from "./DeliverySlotSelection";
import PaymentMethodSelection from "./PaymentMethodSelection";

export default function CheckoutLeft({
  sameAsDelivery,
  setSameAsDelivery,
  handleAddNew,
  handleEditClick,
  selectedAddressId,
  setSelectedAddressId,
  billingAddress,
  onBillingChange,
  billingErrors,
  paymentMethod,
  setPaymentMethod,
  allAddresses,
  isAddressLoading,
  isAddressError,
  deliveryDay,
  setDeliveryDay,
  deliverySlotId,
  setDeliverySlotId,
  slotsData,
  isSlotsError,
  slotsError,
  slotValidationError,
  totalAmount,
  partialPayPercentage,
  minimumPreOrderAmount,
  isCodEligible,
  COD_MIN,
  COD_MAX,
}) {
  const navigate = useNavigate();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const { data: masalaData, isLoading: mosalaIsLoading } =
    useFishloMasalaProducts();

  const selectedAddrObj = allAddresses?.find((a) => a.id === selectedAddressId);

  let previewAddresses = allAddresses?.slice(0, 2) || [];

  if (
    selectedAddressId &&
    selectedAddrObj &&
    !previewAddresses.find((a) => a.id === selectedAddressId)
  ) {
    previewAddresses = [previewAddresses[0], selectedAddrObj];
  }

  const hasMore = allAddresses?.length > 2;

  const handleEditAndClose = (addr) => {
    setShowAddressModal(false); // Close selection list
    handleEditClick(addr); // Open edit modal
  };

  return (
    <div className="col-lg-8">
      {/* Delivery Address Section */}
      <div className="modern-card mb-3 ">
        <div className="card-header-clean">
          <div className="d-flex align-items-center">
            <div className="icon-box me-3">
              <i className="fa-solid fa-location-dot"></i>
            </div>
            <div>
              <h5 className="section-title">
                Delivery Address{" "}
                <span className="text-muted fs-6 ms-1">
                  ({allAddresses?.length || 0}/5)
                </span>
              </h5>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-action-secondary accent-gradient text-light"
            disabled={isAddressLoading}
            onClick={() => {
              if (allAddresses?.length >= 5) {
                navigate("/dashboard/address");
              } else {
                handleAddNew();
              }
            }}
          >
            <i className="fa-solid fa-plus"></i>{" "}
            {allAddresses?.length >= 5 ? null : (
              <>
                <span className="d-none d-sm-inline">Add New</span>
                <span className="d-inline d-sm-none">Add</span>
              </>
            )}
          </button>
        </div>

        <div className="card-body">
          <div className="row g-3">
            {isAddressLoading ? (
              <>
                <CheckoutAddressSkeleton />
                <CheckoutAddressSkeleton />
              </>
            ) : allAddresses?.length > 0 ? (
              <>
                {previewAddresses?.map((addr) => (
                  <div className="col-md-6" key={addr.id}>
                    <AddressCard
                      addr={addr}
                      groupName="preview_addresses"
                      selectedAddressId={selectedAddressId}
                      setSelectedAddressId={setSelectedAddressId}
                      handleEditClick={handleEditClick}
                    />
                  </div>
                ))}
                {hasMore && (
                  <div className="col-12 text-center mt-2">
                    <button
                      type="button"
                      className="btn btn-link text-decoration-none fw-medium text-fishlo"
                      onClick={() => setShowAddressModal(true)}
                    >
                      + {allAddresses.length - previewAddresses.length} More
                      Addresses
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="col-12 text-center py-3">
                <p className="text-muted">
                  No addresses found. Please add one.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {showAddressModal && (
        <AddressSelectionModal
          addresses={allAddresses}
          selectedAddressId={selectedAddressId}
          setSelectedAddressId={setSelectedAddressId}
          handleEditClick={handleEditAndClose}
          setShowAddressModal={setShowAddressModal}
        />
      )}
      <BillingAddress
        sameAsDelivery={sameAsDelivery}
        setSameAsDelivery={setSameAsDelivery}
        billingAddress={billingAddress}
        onBillingChange={onBillingChange}
        billingErrors={billingErrors}
      />
      {(mosalaIsLoading || masalaData?.results?.length > 0) && (
        <div className="pt-2 d-block d-md-none">
          <Addons
            isLoading={mosalaIsLoading}
            data={masalaData}
            isMobile={true}
          />
        </div>
      )}


      {/* Delivery Slot Section */}
      <DeliverySlotSelection
        slotsData={slotsData}
        deliveryDay={deliveryDay}
        setDeliveryDay={setDeliveryDay}
        deliverySlotId={deliverySlotId}
        setDeliverySlotId={setDeliverySlotId}
        isSlotsError={isSlotsError}
        slotsError={slotsError}
        slotValidationError={slotValidationError}
      />

      {(mosalaIsLoading || masalaData?.results?.length > 0) && (
        <div className="pt-3 d-none d-md-block">
          <Addons isLoading={mosalaIsLoading} data={masalaData} />
        </div>
      )}
      {/* Payment Method Section (Desktop) */}
      <div className="d-none d-lg-block">
        <PaymentMethodSelection
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          totalAmount={totalAmount}
          partialPayPercentage={partialPayPercentage}
          minimumPreOrderAmount={minimumPreOrderAmount}
          deliveryDay={deliveryDay}
          isCodEligible={isCodEligible}
          COD_MIN={COD_MIN}
          COD_MAX={COD_MAX}
        />
      </div>
    </div>
  );
}
