import { useEffect } from "react";
import ReactGA from "react-ga4";
import { useNavigate } from "react-router-dom";
import AddressModal from "../components/AddressModal";
import CheckoutLeft from "../components/checkout/CheckoutLeft";
import CheckoutRight from "../components/checkout/ChekoutRight";
import LocationModal from "../components/LocationModal";
import { useCheckout } from "../hooks/useCheckout";

const CheckoutPage = () => {
  const { state, actions } = useCheckout();
  const navigate = useNavigate();
  const { addressData } = state;

  useEffect(() => {
    if (
      !state.cartLoading &&
      !state.cartFetching &&
      (!state.cart?.items || state.cart.items.length === 0)
    ) {
      navigate("/");
    } else if (state.cart?.items?.length > 0 && !state.cartLoading) {
      ReactGA.event("begin_checkout", {
        currency: "INR",
        value: state.cart.subtotal,
        items: state.cart.items.map((item) => ({
          item_id: item.product_slug,
          item_name: item.product_name,
          price: item.unit_price,
          quantity: item.quantity,
        })),
      });
    }
  }, [state.cart, state.cartLoading, state.cartFetching, navigate]);

  useEffect(() => {
    if (
      !state.isAddressLoading &&
      (!addressData?.addresses || addressData.addresses.length === 0)
    ) {
      // Pass 'openModal' as state to the location object
      navigate("/", { state: { triggerAddAddress: true } });
    }
  }, [addressData, state.isAddressLoading, navigate]);

  return (
    <div className="fishlo-checkout-wrapper">
      <title>Checkout | Fishlo</title>
      <div className="container checkout-container py-3 py-md-5">
        <form onSubmit={actions.handlePlaceOrder}>
          <div className="row g-3 g-lg-4">
            {/* Left Column: Forms */}
            <CheckoutLeft
              sameAsDelivery={state.sameAsDelivery}
              setSameAsDelivery={actions.setSameAsDelivery}
              handleEditClick={actions.handleEditClick}
              handleAddNew={actions.handleAddNewClick}
              selectedAddressId={state.selectedAddressId}
              setSelectedAddressId={actions.setSelectedAddressId}
              billingAddress={state.billingAddress}
              onBillingChange={actions.handleBillingChange}
              billingErrors={state.billingErrors}
              paymentMethod={state.paymentMethod}
              setPaymentMethod={actions.setPaymentMethod}
              allAddresses={state.allAddresses}
              isAddressLoading={state.isAddressLoading}
              isAddressError={state.isAddressError}
              // Delivery Slots Props
              deliveryDay={state.deliveryDay}
              setDeliveryDay={actions.setDeliveryDay}
              deliverySlotId={state.deliverySlotId}
              setDeliverySlotId={actions.setDeliverySlotId}
              slotsData={state.slotsData}
              isSlotsError={state.isSlotsError}
              slotsError={state.slotsError}
              slotValidationError={state.slotValidationError}
              totalAmount={state.totalAmount}
              partialPayPercentage={state.partialPayPercentage}
              minimumPreOrderAmount={state.minimumPreOrderAmount}
              isCodEligible={state.isCodEligible}
              COD_MIN={state.COD_MIN}
              COD_MAX={state.COD_MAX}
            />
            <CheckoutRight
              selectedAddressId={state.selectedAddressId}
              allAddresses={state.allAddresses}
              isAddressLoading={state.isAddressLoading}
              isAddressError={state.isAddressError}
              setAppliedCoupon={actions.setAppliedCoupon}
              setUserRemovedCoupon={actions.setUserRemovedCoupon}
              validateCoupon={actions.validateCoupon}
              appliedCoupon={state.appliedCoupon}
              isValidatingCoupon={state.isValidatingCoupon}
              isPaymentVerifying={state.isPaymentVerifying}
              isCreatingOrder={state.isCreatingOrder}
              paymentMethod={state.paymentMethod}
              totalAmount={state.totalAmount}
              setPaymentMethod={actions.setPaymentMethod}
              couponsData={state.couponsData}
              isCouponsLoading={state.isCouponsLoading}
              cart={state.cart}
              isLoading={state.cartLoading}
              paymentError={state.paymentError}
              subtotal={state.subtotal}
              deliveryFee={state.deliveryFee}
              discountVal={state.discountVal}
              isFreeDelivery={state.isFreeDelivery}
              partialPayAmount={state.partialPayAmount}
              partialPayPercentage={state.partialPayPercentage}
              minimumPreOrderAmount={state.minimumPreOrderAmount}
              deliveryDay={state.deliveryDay}
              isCodEligible={state.isCodEligible}
              COD_MIN={state.COD_MIN}
              COD_MAX={state.COD_MAX}
            />
          </div>
        </form>
      </div>

      <LocationModal
        isOpen={state.isMapOpen}
        onClose={() => actions.setIsMapOpen(false)}
        onConfirm={actions.handleMapConfirm}
        mapCenter={
          state.mapAddressData?.latitude && state.mapAddressData?.longitude
            ? {
              lat: parseFloat(state.mapAddressData.latitude),
              lng: parseFloat(state.mapAddressData.longitude),
            }
            : { lat: 19.0845, lng: 73.0084 } // Default fallback
        }
      />

      <AddressModal
        // key={state.mapAddressData?.id || "new-address"}
        isOpen={state.isAddressModalOpen}
        onClose={() => actions.setIsAddressModalOpen(false)}
        prefilledData={state.mapAddressData}
        onAddressCreatedOrUpdated={(id) => actions.setSelectedAddressId(id)}
        shouldValidate={state.autoValidate}
        onSwitchToMap={actions.switchToMapMode}
      />
    </div>
  );
};

export default CheckoutPage;
