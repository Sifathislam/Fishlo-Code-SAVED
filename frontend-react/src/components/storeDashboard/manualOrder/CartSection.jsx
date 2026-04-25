const CartSection = ({
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
  roundOffAmount,
  customerName,
  customerPhone,
  onPlaceOrder,
  cartError,
  checkStockLimit,
}) => {
  return (
    <div className="col-lg-4 bg-white border-start d-none d-lg-flex flex-column z-index-100 shadow-soft">
      <div className="p-3 border-bottom bg-white d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <h6 className="fw-medium m-0">
            <i className="bi bi-cart3 me-2"></i>Order Summary
          </h6>
          <span className="badge bg-light text-dark border ms-2">
            {cart.length} Items
          </span>
        </div>
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
                className="d-flex p-2 mb-2 bg-white rounded shadow-sm border animate-slide-up position-relative"
              >
                {item.type !== 'custom' && (
                  <img
                    src={item.image || "https://placehold.co/50x50?text=No+Img"}
                    alt={item.name}
                    className="rounded object-fit-cover me-2 flex-shrink-0"
                    style={{ width: 50, height: 50 }}
                  />
                )}

                <div className="flex-grow-1 overflow-hidden d-flex flex-column justify-content-between">

                  <div className="d-flex justify-content-between align-items-start ">
                    <h6
                      className="m-0 text-dark small fw-medium text-truncate pe-2"
                      style={{ lineHeight: "1.2" }}
                      title={item.name}
                    >
                      {item.name}
                    </h6>
                    <button
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="btn btn-sm text-danger p-0 opacity-50 hover-opacity-100 lh-1"
                      style={{ marginTop: "-2px" }}
                    >
                      <i className="bi bi-x fs-5"></i>
                    </button>
                  </div>

                  {item.type === 'custom' ? (
                    <div className="text-secondary mb-1" style={{ fontSize: "0.7rem", lineHeight: "1" }}>
                      {item.sell_type === 'WEIGHT' ? `${item.weight}kg` : `${item.quantity}pcs`} × ₹{item.sell_type === 'WEIGHT' ? item.price_per_kg : item.price_per_piece}{item.sell_type === 'WEIGHT' ? '/kg' : '/pc'}
                    </div>
                  ) : (
                    <div className="text-secondary mb-1" style={{ fontSize: "0.7rem", lineHeight: "1" }}>
                      Retail: ₹{item.retailPricePerKg}/{item.is_weighted_product || (item.selectedWeight && item.selectedWeight !== "kg") ? "kg" : "unit"}
                    </div>
                  )}

                  {((item.selectedCut && item.selectedCut !== 'Standard') || (item.type === 'custom' && (item.note || item.cutPrice > 0))) && (
                    <div className="">
                      <span
                        className="badge bg-light text-secondary border fw-normal text-truncate d-inline-block"
                        style={{ maxWidth: '100%', fontSize: '0.6rem' }}
                      >
                        {item.type === 'custom' ? (item.note || "Custom Cut") : item.selectedCut}
                        {item.cutPrice > 0 && <strong className="text-success ms-1">(+₹{item.cutPrice})</strong>}
                      </span>
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-end mt-auto">

                    <div className="d-flex align-items-center" style={{ marginTop: "-16px" }}>
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

                    <div
                      className="d-flex align-items-center bg-light rounded-pill border px-1"
                      style={{ height: "26px" }}
                    >
                      <button
                        onClick={() => item.quantity > 1 && updateQuantity(item.cartItemId, -1)}
                        className={`btn btn-sm btn-link text-dark p-0 px-2 text-decoration-none ${item.quantity <= 1 ? "opacity-25" : ""}`}
                        style={{ fontSize: "1rem", lineHeight: 1 }}
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span className="fw-medium px-1 small" style={{ minWidth: "20px", textAlign: "center" }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          const isAllowed = checkStockLimit(
                            { ...item, product_max_stock: item.product_max_stock, is_weighted_product: (item.selectedWeight && item.selectedWeight !== "kg") || item.is_weighted_product },
                            1,
                            undefined,
                            item.rawWeight // Use the specific weight obj of the item
                          ).allowed;

                          if (!isAllowed) return;
                          updateQuantity(item.cartItemId, 1)
                        }}
                        className={`btn btn-sm btn-link text-dark p-0 px-2 text-decoration-none ${!checkStockLimit(
                          { ...item, product_max_stock: item.product_max_stock, is_weighted_product: (item.selectedWeight && item.selectedWeight !== "kg") || item.is_weighted_product },
                          1,
                          undefined,
                          item.rawWeight
                        ).allowed
                            ? "opacity-25" : ""
                          }`}
                        style={{
                          fontSize: "1rem",
                          lineHeight: 1,
                          cursor: (!checkStockLimit(
                            { ...item, product_max_stock: item.product_max_stock, is_weighted_product: (item.selectedWeight && item.selectedWeight !== "kg") || item.is_weighted_product },
                            1,
                            undefined,
                            item.rawWeight
                          ).allowed) ? "not-allowed" : "pointer"
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
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
          <span className="fw-medium">₹{subtotal.toFixed(2)}</span>
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
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setManualDiscount(isNaN(val) ? 0 : Math.floor(val)); // Force Integer
                  }}
                  placeholder="0"
                  onKeyDown={(e) => {
                    // Prevent entering decimal point
                    if (e.key === "." || e.key === "e") {
                      e.preventDefault();
                    }
                  }}
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
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())} // Force Uppercase
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
                <div className="alert alert-success d-flex justify-content-between align-items-center py-2 mb-3">
                  <div>
                    <div className="fw-bold small">{appliedCoupon.code}</div>
                    <div className="x-small">
                      {appliedCoupon.type === "PERCENT"
                        ? `${appliedCoupon.value}% OFF`
                        : `₹${appliedCoupon.value} OFF`}
                      {" "}( -₹{manualDiscount ? manualDiscount : (subtotal * (appliedCoupon.value / 100)).toFixed(2)} )
                    </div>
                  </div>
                  <button
                    className="btn-close small"
                    onClick={clearCoupon}
                  ></button>
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

        {/* Round Off Display */}
        <div className="d-flex justify-content-between mb-2">
          <span className="text-secondary small">Rounding Off</span>
          <span className="text-danger small">
            {subtotal > 0 && typeof roundOffAmount === 'number' && roundOffAmount !== 0 ? `-${roundOffAmount.toFixed(2)}` : "0.00"}
          </span>
        </div>

        <div className="d-flex justify-content-between align-items-center border-top pt-3 mb-3">
          <span className="fw-medium fs-5 text-dark">Total</span>
          <span className="fw-mediumer fs-3 sd-text-primary">
            ₹{total.toLocaleString()}
          </span>
        </div>
        <button
          className="btn sd-btn-primary w-100 py-3 rounded-3 fw-medium shadow-soft"
          disabled={cart.length === 0 || customerPhone.length !== 10}
          onClick={onPlaceOrder}
          title={customerPhone.length !== 10 ? "Please enter a valid 10-digit phone number" : ""}
        >
          Review Order
        </button>
      </div>
    </div>
  );
};

export default CartSection;
