import { useManualOrderLogic } from "../../hooks/useManualOrderLogic";

import AddressModal from "./manualOrder/AddressModal";
import CartSection from "./manualOrder/CartSection";
import ManualOrderHeader from "./manualOrder/ManualOrderHeader";
import MobileCartOverlay from "./manualOrder/MobileCartOverlay";
import OptionSelectionModal from "./manualOrder/OptionSelectionModal";
import OrderPreviewModal from "./manualOrder/OrderPreviewModal";
import ProductCatalog from "./manualOrder/ProductCatalog";

import ReceiptModal from "./manualOrder/ReceiptModal";

const StoreManualOrder = () => {
  document.title = "Manual Order - Store Dashboard";
  const {
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    orderType,
    setOrderType,
    deliveryAddress,
    setDeliveryAddress,
    showAddressModal,
    setShowAddressModal,
    searchQuery,
    setSearchQuery,
    cart,
    discountMode,
    setDiscountMode,
    manualDiscount,
    setManualDiscount,
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponError,
    showMobileCart,
    setShowMobileCart,
    showPreviewModal,
    setShowPreviewModal,
    selectedCategory,
    setSelectedCategory,
    showOptionModal,
    setShowOptionModal,
    selectedProductForOption,
    setSelectedProductForOption,
    showReceiptModal,
    lastOrderDetails,
    isLoading,
    isCategoriesLoading,
    productList,
    categoriesList,
    handleApplyCoupon,
    clearCoupon,
    initiateAddToCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    subtotal,
    total,
    discountAmount,
    roundOffAmount,
    handlePlaceOrder,
    handleCloseReceipt,
    createOrderMutation,
    orderError,
    receiptData,
    cartError, // New
    checkStockLimit, // New
    paymentMethod,
    setPaymentMethod,
    checkCartItemLimit, // Expose if needed

    // Autocomplete exports
    phoneSuggestions,
    isPhoneSearchLoading,
    handleSelectPhoneSuggestion,
    setShowPhoneSuggestions,
  } = useManualOrderLogic();

  return (
    <div
      className="d-flex flex-column h-100 bg-light animate-fade-in"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <ManualOrderHeader
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        orderType={orderType}
        setOrderType={setOrderType}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        deliveryAddress={deliveryAddress}
        setShowAddressModal={setShowAddressModal}
        phoneSuggestions={phoneSuggestions}
        isPhoneSearchLoading={isPhoneSearchLoading}
        handleSelectPhoneSuggestion={handleSelectPhoneSuggestion}
        setShowPhoneSuggestions={setShowPhoneSuggestions}
      />

      <div className="row g-0 flex-grow-1 overflow-hidden position-relative bg-light">
        <ProductCatalog
          mockProducts={productList.map((p) => ({
            ...p,
            price: p.display_price,
            image: p.featured_image,
            unit: p.unit || "kg",
          }))}
          mockCategories={categoriesList}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onAddToCart={initiateAddToCart}
          isLoading={isLoading}
          isCategoriesLoading={isCategoriesLoading}
          cart={cart}
          updateQuantity={updateQuantity}
          checkStockLimit={checkStockLimit} // Pass helper
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
          customerName={customerName}
          customerPhone={customerPhone}
          onPlaceOrder={() => setShowPreviewModal(true)}
          cartError={cartError} // Pass error
          checkStockLimit={checkStockLimit} // Pass helper
        />
      </div>

      {/* Mobile Bottom Sticky Bar */}
      <div
        className="d-lg-none fixed-bottom bg-white shadow-lg border-top p-3 d-flex align-items-center justify-content-between animate-slide-up"
        style={{ zIndex: 1050 }}
      >
        <div>
          <div className="small text-secondary">{cart.length} Items</div>
          <div className="fw-mediumer text-dark fs-5">
            ₹{total.toLocaleString()}
          </div>
        </div>
        <button
          className="btn sd-btn-primary rounded-pill px-4 fw-medium shadow-soft d-flex align-items-center gap-2"
          onClick={() => setShowMobileCart(true)}
        >
          View Cart <i className="bi bi-chevron-up"></i>
        </button>
      </div>

      {/* Modals */}
      <OptionSelectionModal
        show={showOptionModal}
        onClose={() => {
          setShowOptionModal(false);
          setSelectedProductForOption(null);
        }}
        product={selectedProductForOption}
        onConfirm={addToCart}
        checkStockLimit={checkStockLimit} // Pass helper
      />

      <MobileCartOverlay
        show={showMobileCart}
        onClose={() => setShowMobileCart(false)}
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
        customerName={customerName}
        customerPhone={customerPhone}
        onPlaceOrder={() => setShowPreviewModal(true)}
        cartError={cartError} // Pass error
        checkStockLimit={checkStockLimit} // Pass helper
      />

      <AddressModal
        show={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        deliveryAddress={deliveryAddress}
        setDeliveryAddress={setDeliveryAddress}
      />

      <OrderPreviewModal
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
          couponCode: appliedCoupon?.code,
          roundOffAmount,
        }} // Derived discountAmount for simplicity or export it
        isLoading={createOrderMutation.isPending}
        orderError={orderError}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
      />

      <ReceiptModal
        show={showReceiptModal}
        onClose={handleCloseReceipt}
        receiptData={receiptData}
        isSilent={false}
        autoPrint={true}
      />
    </div>
  );
};

export default StoreManualOrder;
