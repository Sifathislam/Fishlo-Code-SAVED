import { createPortal } from "react-dom";

const MobileCartOverlay = ({
  show,
  onClose,
  cart,
  updateQuantity,
  removeFromCart,
  subtotal,
  total,
  discountMode,
  setDiscountMode,
  manualDiscount,
  setManualDiscount,
  couponCode,
  setCouponCode,
  handleApplyCoupon,
  appliedCoupon,
  clearCoupon,
  couponError,
  customerName,
  customerPhone,
  onPlaceOrder,
  cartError,
  checkStockLimit,
}) => {
  if (!show) return null;

  return createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-white d-flex flex-column animate-slide-up"
      style={{ zIndex: 100000 }}
    >
      <div className="p-3 border-bottom bg-white d-flex justify-content-between align-items-center shadow-sm">
        <div className="d-flex align-items-center">
          <h6 className="fw-medium m-0">
            <i className="bi bi-cart3 me-2"></i>Order Summary
          </h6>
          <span className="badge bg-light text-dark border ms-2">
            {cart.length} Items
          </span>
        </div>
        <button
          className="btn btn-sm btn-danger rounded-pill px-4 fw-medium shadow-sm"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="flex-grow-1 overflow-auto p-3 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center opacity-50">
            <i className="bi bi-basket3 fs-1 text-secondary mb-3"></i>
            <h6 className="fw-medium text-secondary">Empty Cart</h6>
            <p className="small text-muted">Add items from the catalog</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {cart.map((item) => (
              <div
                key={item.cartItemId}
                className="d-flex gap-2 align-items-center border-bottom pb-2"
              >
                <div
                  className="rounded-2 bg-light border flex-shrink-0"
                  style={{
                    width: 40,
                    height: 40,
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                ></div>
                <div
                  className="flex-grow-1 overflow-hidden"
                  style={{ lineHeight: 1.1 }}
                >
                  <div className="d-flex justify-content-between">
                    <div className="fw-medium text-dark text-truncate small mb-1">
                      {item.name}
                    </div>
                    <div className="fw-medium small">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-muted x-small d-flex align-items-center gap-1">
                      {item.selectedCut !== "Standard" && (
                        <span
                          className="badge bg-light text-secondary border px-1 py-0 d-flex align-items-center gap-1"
                          style={{ fontSize: "0.65rem" }}
                        >
                          {item.selectedCut}
                          {item.cutPrice > 0 && (
                            <span className="text-success fw-medium">
                              (+₹{item.cutPrice})
                            </span>
                          )}
                        </span>
                      )}
                  {item.type === 'custom' ? (
                     <div className="text-secondary mb-1" style={{ fontSize: "0.7rem", lineHeight: "1" }}>
                         {item.sell_type === 'WEIGHT' ? `${item.weight}kg` : `${item.pieces}pcs`} × ₹{item.sell_type === 'WEIGHT' ? item.price_per_kg : item.price_per_piece}{item.sell_type === 'WEIGHT' ? '/kg' : '/pc'}
                     </div>
                  ) : (
                     <div className="text-secondary mb-1" style={{ fontSize: "0.7rem", lineHeight: "1" }}>
                         Retail: ₹{item.retailPricePerKg}/{item.is_weighted_product || (item.selectedWeight && item.selectedWeight !== "kg") ? "kg" : "unit"}
                     </div>
                  )}

                  {((item.selectedCut && item.selectedCut !== 'Standard') || (item.type === 'custom' && (item.note || item.cutPrice > 0))) && (
                      <span
                          className="badge bg-light text-secondary border px-1 py-0 d-flex align-items-center gap-1"
                          style={{ fontSize: "0.65rem" }}
                      >
                          {item.type === 'custom' ? (item.note || "Custom Cut") : item.selectedCut}
                          {item.cutPrice > 0 && (
                            <span className="text-success fw-medium">
                              (+₹{item.cutPrice})
                            </span>
                          )}
                      </span>
                  )}
                    </div>
                    <div className="d-flex align-items-center mt-1 mb-1">
                        <span className="fw-medium text-primary" style={{ fontSize: "0.8rem" }}>
                            ₹{item.type === 'custom' 
                               ? ((item.total_price * item.quantity) + (item.cut_price || 0)).toLocaleString()
                               : ((item.baseWeightPrice || (item.price - item.cutPrice)) * item.quantity).toLocaleString()}{" "}
                        </span>
                        {item.type === 'custom' ? (
                           <small className="text-secondary ms-1" style={{ fontSize: "0.65rem", marginTop: "1px" }}>
                               (₹{item.total_price} × {item.quantity})
                           </small>
                        ) : (item.rawWeight && (
                           <small className="text-secondary" style={{ fontSize: "0.7rem", marginTop: "2px" }}>
                               {(() => {
                                  const weightKg = parseFloat(item.rawWeight.weight_kg || 0) * item.quantity;
                                  if (weightKg > 0) {
                                      return `/ ${weightKg >= 1 ? (weightKg % 1 === 0 ? weightKg : weightKg.toFixed(2)) + 'kg' : Math.round(weightKg * 1000) + 'g'}`;
                                  }
                                  return `/ ${item.selectedWeight || item.unit}`;
                               })()}
                           </small>
                        ))}
                    </div>
                    <div className="d-flex align-items-center bg-white border rounded pe-1 mt-1">
                      <button
                        className={`btn btn-sm text-secondary py-0 px-1 shadow-none ${item.quantity <= 1 ? "opacity-25" : ""}`}
                        onClick={() =>
                          item.quantity > 1 &&
                          updateQuantity(item.cartItemId, -1)
                        }
                        style={{ border: "none" }}
                      >
                        <i className="bi bi-dash"></i>
                      </button>
                      <span
                        className="small fw-medium px-1"
                        style={{
                          minWidth: "15px",
                          textAlign: "center",
                          fontSize: "0.8rem",
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        className="btn btn-sm text-dark py-0 px-1 shadow-none"
                        onClick={() => updateQuantity(item.cartItemId, 1)}
                        style={{ border: "none" }}
                      >
                        <i className="bi bi-plus"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.cartItemId)}
                  className="btn btn-sm text-danger p-0 ms-1 opacity-50 hover-opacity-100"
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-light border-top">
         {cartError && (
             <div className="alert alert-danger py-2 mb-3 small d-flex align-items-center">
                 <i className="bi bi-exclamation-circle-fill me-2 fs-6"></i>
                 {cartError}
             </div>
         )}
        <div className="d-flex justify-content-between mb-2">
          <span className="text-secondary small">Subtotal</span>
          <span className="fw-medium">₹{subtotal.toLocaleString()}</span>
        </div>
        <div className="mb-3">
          <div className="d-flex bg-light rounded-pill p-1 mb-2 border">
            <button
              className={`btn btn-sm flex-fill rounded-pill fw-medium transition-all ${discountMode === "MANUAL" ? "sd-btn-primary text-white shadow-sm" : "text-secondary border-0"}`}
              onClick={() => {
                setDiscountMode("MANUAL");
                clearCoupon();
                setManualDiscount(0);
              }}
            >
              Manual
            </button>
            <button
              className={`btn btn-sm flex-fill rounded-pill fw-medium transition-all ${discountMode === "COUPON" ? "sd-btn-primary text-white shadow-sm" : "text-secondary border-0"}`}
              onClick={() => {
                setDiscountMode("COUPON");
                setManualDiscount(0);
              }}
            >
              Coupon
            </button>
          </div>

          {discountMode === "MANUAL" ? (
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-secondary small">Discount Amount</span>
              <div
                className="input-group input-group-sm w-auto bg-white rounded-3 border-0 shadow-sm ps-2"
                style={{ maxWidth: "120px", border: "1px solid #dee2e6" }}
              >
                <span className="input-group-text border-0 bg-transparent p-0 text-secondary">
                  ₹
                </span>
                <input
                  type="number"
                  className="form-control border-0 bg-transparent p-1 shadow-none text-end fw-medium"
                  value={manualDiscount || ""}
                  onChange={(e) =>
                    setManualDiscount(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                />
              </div>
            </div>
          ) : (
            <div>
              {!appliedCoupon ? (
                <div className="d-flex align-items-center bg-white rounded-3 border shadow-sm p-1">
                  <input
                    type="text"
                    className="form-control border-0 shadow-none bg-transparent ps-2 py-1 small"
                    placeholder="Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button
                    className="btn btn-sm btn-light sd-text-primary fw-medium px-3 rounded-3"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode}
                  >
                    APPLY
                  </button>
                </div>
              ) : (
                <div className="d-flex justify-content-between align-items-center bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 p-2">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="bg-white text-success rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: 24, height: 24 }}
                    >
                      <i
                        className="bi bi-check-lg"
                        style={{ fontSize: "0.8rem" }}
                      ></i>
                    </div>
                    <div className="lh-1">
                      <div className="fw-medium text-success small">
                        {appliedCoupon.code}
                      </div>
                      <div className="x-small text-success opacity-75">
                        {appliedCoupon.type === "PERCENT"
                          ? `${appliedCoupon.value}% OFF`
                          : `₹${appliedCoupon.value} OFF`}
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-link text-success p-0 opacity-50 hover-opacity-100"
                    onClick={clearCoupon}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              )}
              {couponError && (
                <div className="text-danger x-small mt-1 ms-1">
                  <i className="bi bi-exclamation-circle me-1"></i>
                  {couponError}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="d-flex justify-content-between align-items-center border-top pt-3 mb-3">
          <span className="fw-medium fs-5 text-dark">Total</span>
          <span className="fw-mediumer fs-3 sd-text-primary">
            ₹{total.toLocaleString()}
          </span>
        </div>
        <button
          className="btn sd-btn-primary w-100 py-3 rounded-3 fw-medium shadow-soft"
          disabled={cart.length === 0 || !customerName || customerPhone.length !== 10}
          onClick={onPlaceOrder}
          title={customerPhone.length !== 10 ? "Please enter a valid 10-digit phone number" : ""}
        >
          Review Order
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default MobileCartOverlay;
