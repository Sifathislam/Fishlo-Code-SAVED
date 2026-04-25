import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRemoveCartItem } from "../../features/useCart";
import CartSectionSkeleton from "./CartSectionSkeleton";
import CheckoutChatBox from "./CheckoutChatBox";
import PaymentMethodSelection from "./PaymentMethodSelection";

export default function CheckoutRight({
  selectedAddressId,
  allAddresses,
  setAppliedCoupon,
  setUserRemovedCoupon,
  appliedCoupon,
  paymentMethod,
  setPaymentMethod,
  isAddressLoading,
  isCreatingOrder,
  isPaymentVerifying,
  cart,
  isLoading,
  validateCoupon,
  isValidatingCoupon,
  couponsData,
  isCouponsLoading,
  paymentError,
  totalAmount,
  subtotal,
  deliveryFee,
  discountVal,
  isFreeDelivery,
  partialPayAmount,
  partialPayPercentage,
  minimumPreOrderAmount,
  deliveryDay,
  isCodEligible,
  COD_MIN,
  COD_MAX,
}) {
  const navigate = useNavigate();
  const selectedAddress = allAddresses?.find((a) => a.id === selectedAddressId);
  const removeItem = useRemoveCartItem();

  const [couponInput, setCouponInput] = useState("");
  const [error, setError] = useState("");

  const items = cart?.items ?? [];

  const calculatePotentialDiscount = (cpn, total) => {
    if (cpn.min_order_amount && total < parseFloat(cpn.min_order_amount)) {
      return 0;
    }
    if (cpn.discount_type === "PERCENTAGE") {
      let calc = total * (parseFloat(cpn.discount_percentage) / 100);
      if (cpn.max_discount) {
        calc = Math.min(calc, parseFloat(cpn.max_discount));
      }
      return calc;
    }
    return parseFloat(cpn.discount_fixed_amount) || 0;
  };

  const availableCoupons = (couponsData?.discounts || [])
    .filter((cpn) => {
      // If not first order, remove FISHLO
      if (cpn.code === "FISHLO" && cart && !cart.is_first_order) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const discountA = calculatePotentialDiscount(a, subtotal);
      const discountB = calculatePotentialDiscount(b, subtotal);
      return discountB - discountA;
    });

  // We are preferring the prop `totalAmount` passed in from CheckoutPage now to keep it consistent
  const displayTotalAmount = totalAmount;

  const rawValue = Math.max(0, subtotal - discountVal + deliveryFee);
  const roundingOffDisplay = (rawValue % 1).toFixed(2).substring(1);

  const isUpiOnDelivery = paymentMethod === "UPI_ON_DELIVERY";
  const balanceOnDelivery = isUpiOnDelivery
    ? displayTotalAmount - partialPayAmount
    : 0;

  const handleApplyCoupon = (code) => {
    const targetCode = typeof code === "string" ? code : couponInput;
    if (!targetCode.trim()) return setError("Please enter a code");
    setError("");
    setCouponInput(targetCode);

    validateCoupon(code, {
      onSuccess: (res) => {
        if (res.success) {
          setAppliedCoupon(res.data); // Store the whole object from API
          setCouponInput("");
        } else {
          setError(res.message || "Invalid coupon");
        }
      },
      onError: (err) => {
        setError(err.response?.data?.message || "Coupon could not be applied");
      },
    });
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    if (setUserRemovedCoupon) {
      setUserRemovedCoupon(true);
    }
  };

  const isInDeliveryZone = items?.length > 0 ? items[0]?.isInDeliveryZone : true;

  const MAX_ORDER_LIMIT = 460000; // 4.6 Lakhs
  const isOverLimit = totalAmount > MAX_ORDER_LIMIT;

  const hasOutOfStockItems = items?.some((item) => item.isOutOfStock);

  const handleRemove = (e, id) => {
    e?.preventDefault();
    const currentCartId = localStorage.getItem("cart_id");
    if (removeItem.isLoading) return;
    removeItem.mutate({ id, cartId: currentCartId });
  };

  return (
    <div className="col-lg-4">
      <div className="sticky-summary">
        {isLoading ? (
          <CartSectionSkeleton />
        ) : (
          <div className="modern-card bg-white">
            <div className="card-header-clean bg-light-fishlo border-bottom-0 pb-0">
              <h5 className="fw-medium mb-0 section-title">Order Summary</h5>
              <span className="badge checkout-badge bg-white text-fishlo shadow-sm">
                {cart?.items_count} Items
              </span>
            </div>

            <div className="card-body">
              {!isInDeliveryZone && selectedAddressId && (
                <div className="delivery-zone-warning mb-4 p-3 animate-fade-in">
                  <div className="d-flex align-items-start">
                    <i className="fa-solid fa-circle-exclamation text-danger mt-1 me-2"></i>
                    <div>
                      <h6
                        className="text-danger fw-medium mb-1"
                        style={{ fontSize: "0.85rem" }}
                      >
                        Location Not Serviceable
                      </h6>
                      <p
                        className="text-muted m-0"
                        style={{ fontSize: "0.75rem", lineHeight: "1.3" }}
                      >
                        Sorry! We don't deliver to this area yet. Please select
                        another address to continue.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {hasOutOfStockItems && (
                <div className="alert alert-warning mb-4 p-3 animate-fade-in border-warning">
                  <div className="d-flex align-items-start">
                    <i className="fa-solid fa-triangle-exclamation text-warning mt-1 me-2"></i>
                    <div>
                      <h6
                        className="text-warning fw-medium mb-1"
                        style={{ fontSize: "0.85rem" }}
                      >
                        Out of Stock Items
                      </h6>
                      <p
                        className="text-dark m-0"
                        style={{ fontSize: "0.75rem", lineHeight: "1.3" }}
                      >
                        Some items in your cart are currently out of stock. Please remove them to proceed with your order.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="products-scroll">
                {items?.map((item) => (
                  <div key={item?.id} className="cart-item">
                    <div
                      className={`item-img ${!item?.isInDeliveryZone || item?.isOutOfStock ? "cart-out-of-zone" : ""}`}
                      style={{
                        position: "relative",
                        opacity: item?.isInDeliveryZone && !item?.isOutOfStock ? 1 : 0.6,
                        filter: item?.isInDeliveryZone && !item?.isOutOfStock
                          ? "none"
                          : "grayscale(0.5)",
                        transition: "all 0.3s ease",
                        cursor: item?.isInDeliveryZone && !item?.isOutOfStock
                          ? "default"
                          : "not-allowed",
                      }}
                    >
                      <img src={item?.product_image} alt="Product" />
                      {!(item?.isOutOfStock || !item?.isInDeliveryZone) && (
                        <span className="item-qty">{item?.quantity}</span>
                      )}
                      {(item?.isOutOfStock) && (
                        <div className="out-of-zone-label-right">
                          {!item?.isInDeliveryZone ? "" : "OUT OF STOCK"}
                        </div>
                      )}

                      {/* Cross Icon for Out of Stock or Out of Zone */}
                      {(item?.isOutOfStock || !item?.isInDeliveryZone) && (
                        <button
                          className="cart-remove-item"
                          onClick={(e) => handleRemove(e, item?.id)}
                          aria-label={`Remove ${item?.product_name}`}
                          disabled={removeItem?.isLoading}
                          style={{
                            position: "absolute",
                            top: "-8px",
                            left: "-8px",
                            background: "white",
                            border: "1px solid #dc3545",
                            borderRadius: "50%",
                            width: "24px",
                            height: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#dc3545",
                            cursor: "pointer",
                            zIndex: 10,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            padding: 0
                          }}
                        >
                          <i className="fa-solid fa-xmark" style={{ fontSize: "12px" }} />
                        </button>
                      )}
                    </div>
                    <div className="item-details">
                      <h6
                        onClick={() => navigate(`/${item?.product_slug}`)}
                        className="item-title"
                        style={{ cursor: "pointer" }}
                      >
                        {item?.product_name}
                      </h6>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {item?.is_weighted_product ? item?.weight : ""}
                          {item?.selected_cuts?.length > 0 &&
                            ` | ${item.selected_cuts[0]?.name}`}
                          {item?.selected_cuts[0]?.price > 0 && (
                            <> (₹{item?.selected_cuts[0]?.price})</>
                          )}
                        </small>
                        <div className="text-end">
                          <span className="item-price d-block">
                            ₹{item?.total}
                          </span>
                          {/* {item?.unit_tax_amount > 0 && (
                            <small
                              className="text-muted"
                              style={{
                                fontSize: "0.65rem",
                                display: "block",
                                marginTop: "-4px",
                              }}
                            ></small>
                          )} */}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ChatBox Section */}
              {/* <div className="mt-4">
                {(cart?.minimum_bargain_amount && totalAmount < cart.minimum_bargain_amount) ? (
                  <div className="alert alert-info p-3 animate-fade-in border-info mb-0" style={{ backgroundColor: "#e8f4fd" }}>
                    <div className="d-flex align-items-start">
                      <i className="fa-solid fa-circle-info text-info mt-1 me-2"></i>
                      <div>
                        <p className="text-dark m-0" style={{ fontSize: "0.75rem", lineHeight: "1.3" }}>
                          AI Bargaining unlocks at <strong>₹{cart.minimum_bargain_amount}</strong>. Add <strong>₹{(cart.minimum_bargain_amount - cart.subtotal)}</strong> more to negotiate with Meena Tai.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <CheckoutChatBox />
                )}
              </div> */}

              {/* Coupon Section */}
              <div className="mt-4">
                {!appliedCoupon ? (
                  <>
                    <label className="small fw-medium text-muted mb-2 d-block">
                      Have a Coupon?
                    </label>
                    <div className="input-group mb-1">
                      <input
                        type="text"
                        className="form-control coupon-input shadow-none"
                        placeholder="Enter code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        disabled={isValidatingCoupon}
                      />
                      <button
                        className="btn accent-gradient text-light"
                        type="button"
                        onClick={() => handleApplyCoupon(couponInput)}
                        disabled={isValidatingCoupon || !couponInput}
                      >
                        Apply
                      </button>
                    </div>
                    {error && (
                      <small className="text-danger animate-fade-in">
                        {error}
                      </small>
                    )}
                  </>
                ) : (
                  <div className="applied-coupon-box animate-fade-in">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <i className="fa-solid fa-tag text-success me-2"></i>
                        <span className="fw-medium text-uppercase">
                          {appliedCoupon.code}
                        </span>
                        <small className="d-block text-success">
                          {appliedCoupon.discount_type === "PERCENTAGE"
                            ? `${appliedCoupon.discount_percentage}% discount applied!`
                            : `₹${discountVal} off applied!`}
                        </small>
                      </div>
                      <button
                        className="btn-remove-coupon"
                        onClick={removeCoupon}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="coupon-grid-container mb-3 mt-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="section-subtitle">Available Offers</span>
                  <span className="offers-count">
                    {availableCoupons?.length} Coupons
                  </span>
                </div>

                <div className="fishlo-offers-grid">
                  {availableCoupons?.slice(0, 4).map((cpn) => {
                    const isApplied = appliedCoupon?.code === cpn.code;

                    return (
                      <div
                        key={cpn.code}
                        className={`offer-stripe-card ${isApplied ? "is-applied" : ""
                          }`}
                        style={{ cursor: isApplied ? "default" : "pointer" }}
                        onClick={() =>
                          !isApplied && handleApplyCoupon(cpn.code)
                        }
                      >
                        <div className="offer-left">
                          <div className="offer-icon">
                            <i
                              className={`fa-solid ${isApplied ? "fa-circle-check" : "fa-bolt"
                                }`}
                            ></i>
                          </div>
                        </div>

                        <div className="offer-right">
                          <div className="offer-header d-flex justify-content-between align-items-start">
                            <div className="offer-info-stack">
                              <span className="offer-code">{cpn.code}</span>
                              <span className="offer-save-text">
                                SAVE{" "}
                                {cpn.discount_type === "PERCENTAGE"
                                  ? `${cpn.discount_percentage}%`
                                  : `₹${cpn.discount_fixed_amount}`}
                              </span>
                            </div>

                            <span
                              className={`offer-action-text ${isApplied ? "applied" : ""
                                }`}
                            >
                              {isValidatingCoupon && couponInput === cpn.code
                                ? "..."
                                : isApplied
                                  ? "APPLIED"
                                  : "APPLY"}
                            </span>
                          </div>

                          {/* FOOTER: Description with truncation logic */}
                          <div className="offer-footer mt-1">
                            {cpn.code === "FISHLO" && (
                              <span className="offer-desc text-success fw-medium mb-1 d-block" style={{ fontSize: "0.58rem" }}>
                                + Free Delivery
                              </span>
                            )}
                            <span className="offer-desc">
                              {cpn.discount_type === "PERCENTAGE"
                                ? `Get ${cpn.discount_percentage}% off on your order`
                                : `Flat ₹${cpn.discount_fixed_amount} off today`}
                            </span>
                          </div>
                        </div>

                        <div className="offer-dot"></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bill-details mt-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted fw-medium">Subtotal</span>
                  <span className="fw-medium">₹{subtotal}</span>
                </div>

                {appliedCoupon && (
                  <div className="d-flex justify-content-between mb-2 animate-fade-in">
                    <span className="text-success fw-medium">
                      Discount{" "}
                      {appliedCoupon.discount_type === "PERCENTAGE"
                        ? `(${appliedCoupon.discount_percentage}%)`
                        : ""}
                    </span>
                    <span className="text-success fw-medium">
                      <i
                        className="fa-solid fa-minus"
                        style={{ fontSize: "12px" }}
                      />{" "}
                      ₹{discountVal?.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="d-flex justify-content-between mb-2">
                  <span
                    className={`${isFreeDelivery ? "text-success" : "text-muted"} fw-medium`}
                  >
                    Delivery
                  </span>
                  <span
                    className={`${isFreeDelivery ? "text-success" : ""} fw-medium`}
                  >
                    {isFreeDelivery ? "Free" : `₹${deliveryFee}`}
                  </span>
                </div>
                {roundingOffDisplay !== ".00" && (
                  <div className="d-flex justify-content-between mb-2 animate-fade-in">
                    <span className="text-muted fw-medium">Rounding Off</span>
                    <span className="text-muted fw-medium">
                      {roundingOffDisplay}
                    </span>
                  </div>
                )}

                <div className="total-divider"></div>
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <span className="d-block text-muted ">Total Amount</span>
                  <span className="fs-4 fw-medium text-fishlo">
                    ₹{totalAmount}
                  </span>
                </div>

                {/* {isUpiOnDelivery && (
                  <div className="payment-split-card rounded-3 overflow-hidden border mt-4 mb-3 animate-fade-in shadow-sm">
                    <div className="p-3 bg-light border-bottom">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <span className="d-block fw-medium text-dark">
                            Pay Now to Confirm
                          </span>
                          <small className="text-muted d-block">Partial Payment</small>
                        </div>
                        <span className="fs-4 fw-medium text-fishlo">
                          ₹{partialPayAmount}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-white">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <span className="d-block fw-medium text-dark">
                            Pay on Delivery
                          </span>
                          <small className="text-muted">
                            Balance via Cash/UPI at door
                          </small>
                        </div>
                        <span className="fw-medium text-dark">
                          ₹{balanceOnDelivery}
                        </span>
                      </div>
                    </div>

                    <div className="bg-light p-2 text-center border-top">
                      <small
                        className="text-muted italic"
                        style={{ fontSize: "0.75rem" }}
                      >
                        The ₹{partialPayAmount} will be adjusted in your final bill.
                      </small>
                    </div>
                  </div>
                )} */}
              </div>

              <div className="d-block d-lg-none mt-3">
                <PaymentMethodSelection
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  isMobile={true}
                  totalAmount={totalAmount}
                  partialPayPercentage={partialPayPercentage}
                  minimumPreOrderAmount={minimumPreOrderAmount}
                  deliveryDay={deliveryDay}
                  isCodEligible={isCodEligible}
                  COD_MIN={COD_MIN}
                  COD_MAX={COD_MAX}
                />
              </div>

              <div className="delivery-confirmation-box mt-4 p-3 rounded-3 bg-light border-start border-4 border-danger">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label
                    className="small fw-medium text-muted text-uppercase"
                    style={{ letterSpacing: "0.5px", fontSize: "0.7rem" }}
                  >
                    Deliver To
                  </label>
                  {selectedAddress && (
                    <span
                      className={`badge-tag tag-${selectedAddress.address_type?.toLowerCase()}`}
                    >
                      {selectedAddress.address_type}
                    </span>
                  )}
                </div>

                {selectedAddress ? (
                  <div className="selected-address-preview">
                    <h6
                      className="mb-1 fw-medium"
                      style={{ fontSize: "0.9rem" }}
                    >
                      {selectedAddress.recipient_name}
                    </h6>
                    <p
                      className="mb-0 text-muted small line-clamp-2"
                      style={{ lineHeight: "1.4" }}
                    >
                      {selectedAddress.house_details},{" "}
                      {selectedAddress.address_line_2}
                      <br />
                      {selectedAddress.city}, {selectedAddress.state} -{" "}
                      {selectedAddress.postal_code}
                    </p>
                    <p className="mb-0 text-muted small fw-medium mt-1">
                      <i
                        className="fa-solid fa-phone me-1"
                        style={{ fontSize: "0.7rem" }}
                      ></i>
                      {selectedAddress.recipient_phone}
                    </p>
                  </div>
                ) : (
                  <div className="text-danger small py-1">
                    <i className="fa-solid fa-circle-exclamation me-2"></i>
                    Please select a delivery address
                  </div>
                )}
              </div>
              {paymentError && (
                <div
                  className="alert alert-danger mt-3 mb-0 p-2 d-flex align-items-center animate-fade-in"
                  style={{ fontSize: "0.8rem" }}
                >
                  <i className="fa-solid fa-circle-xclamation me-2"></i>
                  {paymentError}
                </div>
              )}
              {isOverLimit && (
                <div
                  className="alert alert-warning mt-3 mb-0 p-3 d-flex align-items-start animate-fade-in"
                  style={{ fontSize: "0.85rem" }}
                >
                  <i className="fa-solid fa-circle-exclamation me-2 mt-1"></i>
                  <div>
                    <span className="fw-medium d-block">
                      Order Limit Exceeded
                    </span>
                    Maximum order value is ₹4,60,000. Please reduce items in
                    your cart to proceed.
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-fishlo w-100 py-3 mt-4 btn-glow d-flex align-items-center justify-content-center"
                // Disable if address missing OR if any transaction is in progress
                disabled={
                  !selectedAddressId ||
                  !isInDeliveryZone ||
                  hasOutOfStockItems ||
                  isCreatingOrder ||
                  isPaymentVerifying ||
                  cart.items.length === 0 ||
                  isOverLimit
                }
              >
                {isCreatingOrder ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Processing Order...
                  </>
                ) : isPaymentVerifying ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Verifying Payment...
                  </>
                ) : isInDeliveryZone === false ? (
                  <>Cannot Deliver to This Location</>
                ) : hasOutOfStockItems ? (
                  <>Remove Out of Stock Items</>
                ) : (
                  <>
                    {paymentMethod === "COD" 
                      ? "Place Order (Cash On Delivery)" 
                      : (isFreeDelivery ? "Place Order" : "Proceed to Pay")}
                    <i className="fa-solid fa-arrow-right ms-2"></i>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
