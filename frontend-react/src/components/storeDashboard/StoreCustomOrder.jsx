import React from 'react';
import { useCustomOrderLogic } from "../../hooks/useCustomOrderLogic";
import CustomOrderHeader from "./manualOrder/CustomOrderHeader";
import CustomOrderForm from "./manualOrder/CustomOrderForm";
import CartSection from "./manualOrder/CartSection";
import AddressModal from "./manualOrder/AddressModal";
import CustomOrderPreviewModal from "./manualOrder/CustomOrderPreviewModal";
import ReceiptModal from "./manualOrder/ReceiptModal";

const StoreCustomOrder = () => {
  document.title = "Custom Order - Store Dashboard";
  const logic = useCustomOrderLogic();

  const {
    customerName, setCustomerName,
    customerPhone, setCustomerPhone,
    orderType, setOrderType,
    deliveryAddress, setDeliveryAddress,
    showAddressModal, setShowAddressModal,
    itemName, setItemName,
    itemWeight, setItemWeight,
    itemPricePerKg, setItemPricePerKg,
    itemCutPrice, setItemCutPrice,
    itemQuantity, setItemQuantity,
    itemNote, setItemNote,
    sellType, setSellType,
    cart, addToCart, removeFromCart, updateQuantity,
    subtotal, total, discountAmount, roundOffAmount,
    discountMode, setDiscountMode,
    manualDiscount, setManualDiscount,
    couponCode, setCouponCode,
    appliedCoupon, handleApplyCoupon, clearCoupon, couponError,
    showMobileCart, setShowMobileCart,
    showPreviewModal, setShowPreviewModal,
    showReceiptModal, receiptData, handleCloseReceipt,
    handlePlaceOrder, orderError, isPending,
    paymentMethod, setPaymentMethod,
    
    // Autocomplete exports
    phoneSuggestions,
    isPhoneSearchLoading,
    handleSelectPhoneSuggestion,
    setShowPhoneSuggestions,
  } = logic;

  return (
    <div className="d-flex flex-column h-100 bg-light animate-fade-in" style={{ fontFamily: "'Inter', sans-serif" }}>
      <CustomOrderHeader
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        orderType={orderType}
        setOrderType={setOrderType}
        deliveryAddress={deliveryAddress}
        setShowAddressModal={setShowAddressModal}
        phoneSuggestions={phoneSuggestions}
        isPhoneSearchLoading={isPhoneSearchLoading}
        handleSelectPhoneSuggestion={handleSelectPhoneSuggestion}
        setShowPhoneSuggestions={setShowPhoneSuggestions}
      />

      <div className="row g-0 flex-grow-1 overflow-hidden position-relative bg-light">
        <CustomOrderForm
          itemName={itemName} setItemName={setItemName}
          itemWeight={itemWeight} setItemWeight={setItemWeight}
          itemPricePerKg={itemPricePerKg} setItemPricePerKg={setItemPricePerKg}
          itemCutPrice={itemCutPrice} setItemCutPrice={setItemCutPrice}
          itemQuantity={itemQuantity} setItemQuantity={setItemQuantity}
          itemNote={itemNote} setItemNote={setItemNote}
          sellType={sellType} setSellType={setSellType}
          addToCart={addToCart}
        />

        <CartSection
          cart={cart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          subtotal={subtotal}
          total={total}
          discountMode={discountMode}
          setDiscountMode={setDiscountMode}
          manualDiscount={manualDiscount}
          setManualDiscount={setManualDiscount}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          handleApplyCoupon={handleApplyCoupon}
          appliedCoupon={appliedCoupon}
          clearCoupon={clearCoupon}
          couponError={couponError}
          roundOffAmount={roundOffAmount}
          onPlaceOrder={() => setShowPreviewModal(true)}
          customerPhone={customerPhone}
          checkStockLimit={() => ({ allowed: true })} 
          cartError=""
        />
      </div>

      <AddressModal
        show={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        deliveryAddress={deliveryAddress}
        setDeliveryAddress={setDeliveryAddress}
      />

      <CustomOrderPreviewModal
        show={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onConfirm={handlePlaceOrder}
        customerDetails={{
          name: customerName,
          phone: customerPhone,
          orderType,
          address: deliveryAddress,
        }}
        cart={cart}
        calculations={{
          subtotal,
          discountAmount,
          total,
          roundOffAmount,
        }}
        isLoading={isPending}
        orderError={orderError}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
      />

      <ReceiptModal
        show={showReceiptModal}
        onClose={handleCloseReceipt}
        receiptData={receiptData}
        autoPrint={true}
      />
    </div>
  );
};

export default StoreCustomOrder;
