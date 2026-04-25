import { useEffect } from "react";

const PaymentMethodSelection = ({
  paymentMethod,
  setPaymentMethod,
  isMobile = false,
  totalAmount = 0,
  partialPayPercentage = 0,
  minimumPreOrderAmount = 0,
  deliveryDay = "TODAY",
  isCodEligible = true,
  COD_MIN = 299,
  COD_MAX = 1999
}) => {
  const pct = parseFloat(partialPayPercentage) || 0;
  const minAmount = parseFloat(minimumPreOrderAmount) || 0;
  const isBelowMinimum = minAmount > 0 && totalAmount < minAmount;
  const isFeatureConfigured = pct > 0;
  const isTodaySelected = deliveryDay === "TODAY";


  const isUpiDisabled = !isFeatureConfigured || isTodaySelected || isBelowMinimum;

  // Auto-revert selection if not eligible or if today is selected
  useEffect(() => {
    if (isUpiDisabled && paymentMethod === "UPI_ON_DELIVERY") {
      setPaymentMethod("Razorpay");
    }
  }, [paymentMethod, isUpiDisabled, setPaymentMethod]);

  const partialPayAmount = Math.floor(totalAmount * (pct / 100));

  const content = (
    <>
      <label
        className={`payment-option ${isMobile ? 'mb-2' : 'mb-3'} ${paymentMethod === "Razorpay" ? "active-payment" : ""
          }`}
      >
        <input
          type="radio"
          name={`paymentMethod${isMobile ? "_mobile" : ""}`}
          value="Razorpay"
          checked={paymentMethod === "Razorpay"}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="hidden-radio"
        />
        <div
          className="payment-content"
          style={isMobile ? { padding: '10px 14px', minHeight: '80px' } : {}}
          onClick={() => setPaymentMethod("Razorpay")}
        >
          <div className="d-flex align-items-center">
            <div className="radio-circle"></div>
            <div className={isMobile ? "ms-2" : "ms-3"}>
              <span className={`d-block fw-medium text-dark ${isMobile ? 'small' : ''}`} style={isMobile ? { fontSize: '0.85rem' } : {}}>
                UPI / Cards / Netbanking
              </span>
              <small className="text-muted" style={{ fontSize: isMobile ? "0.68rem" : "0.75rem", display: "block" }}>
                Pay now using UPI or cards
              </small>
            </div>
          </div>
          <div className={`payment-logos ${!isMobile ? "d-none d-sm-block" : ""}`}>
            <img
              src="https://cdn.razorpay.com/static/assets/merchant-badge/badge-dark.png"
              alt="Razorpay"
              width={isMobile ? "60" : "100"}
              style={isMobile ? { objectFit: 'contain' } : {}}
            />
          </div>
        </div>
      </label>
      {/* Comment it for temporarily we will enable it when we have good trust  */}
      {/* <label
        className={`payment-option ${isMobile ? 'mb-0' : 'mb-3'} ${paymentMethod === "UPI_ON_DELIVERY" ? "active-payment" : ""
          }`}
      >
        <input
          type="radio"
          name={`paymentMethod${isMobile ? "_mobile" : ""}`}
          value="UPI_ON_DELIVERY"
          checked={paymentMethod === "UPI_ON_DELIVERY" && !isUpiDisabled}
          onChange={(e) => {
            if (!isUpiDisabled) setPaymentMethod(e.target.value);
          }}
          className="hidden-radio"
          disabled={isUpiDisabled}
        />
        <div
          className={`payment-content ${isUpiDisabled ? 'disabled-payment' : ''}`}
          style={{
            ...(isMobile ? { padding: '10px 14px', minHeight: '80px' } : {}),
            ...(isUpiDisabled ? { opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#f9f9f9' } : {})
          }}
          onClick={() => {
            if (!isUpiDisabled) setPaymentMethod("UPI_ON_DELIVERY");
          }}
        >
          <div className="d-flex align-items-center">
            <div className="radio-circle"></div>
            <div className={isMobile ? "ms-2" : "ms-3"}>
              <span className={`d-block fw-medium text-muted ${isMobile ? 'small' : ''}`} style={isMobile ? { fontSize: '0.85rem' } : {}}>
                Pre-Order (Partial Pay)
              </span>
              {isUpiDisabled ? (
                <small
                  className="text-danger fw-bold"
                  style={{ fontSize: isMobile ? "0.68rem" : "0.75rem", display: "block", marginTop: isMobile ? "2px" : "0", lineHeight: '1.2' }}
                >
                  {!isFeatureConfigured
                    ? "Partial pay is not available"
                    : isBelowMinimum
                      ? `Order above ₹${minAmount} to pay partial (₹${Math.floor(minAmount * (pct / 100))} upfront)`
                      : "Select Tomorrow's delivery to enable Partial Pay"}
                </small>
              ) : (
                <small
                  className="text-success fw-medium"
                  style={{ fontSize: isMobile ? "0.68rem" : "0.75rem", display: "block", marginTop: isMobile ? "2px" : "0", lineHeight: '1.2' }}
                >
                  Pay {pct}% now (₹{partialPayAmount}), rest on delivery
                </small>
              )}
            </div>
          </div>
          <div className={`payment-logos ${!isMobile ? "d-none d-sm-block" : ""}`}>
            <img
              src="/marketing/upi-on-delivery.svg"
              alt="UPI on Delivery"
              width={isMobile ? "60" : "100"}
              style={isMobile ? { objectFit: 'contain' } : {}}
            />
          </div>
        </div>
      </label> */}

      <label
        className={`payment-option ${isMobile ? 'mb-0' : 'mb-0'} ${paymentMethod === "COD" ? "active-payment" : ""}`}
      >
        <input
          type="radio"
          name={`paymentMethod${isMobile ? "_mobile" : ""}`}
          value="COD"
          checked={paymentMethod === "COD" && isCodEligible}
          onChange={(e) => {
            if (isCodEligible) setPaymentMethod(e.target.value);
          }}
          className="hidden-radio"
          disabled={!isCodEligible}
        />
        <div
          className={`payment-content ${!isCodEligible ? 'disabled-payment' : ''}`}
          style={{
            ...(isMobile ? { padding: '10px 14px', minHeight: '80px' } : {}),
            ...(!isCodEligible ? { opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#f9f9f9' } : {})
          }}
          onClick={() => {
            if (isCodEligible) setPaymentMethod("COD");
          }}
        >
          <div className="d-flex align-items-center">
            <div className="radio-circle"></div>
            <div className={isMobile ? "ms-2" : "ms-3"}>
              <span className={`d-block fw-medium text-dark ${isMobile ? 'small' : ''}`} style={isMobile ? { fontSize: '0.85rem' } : {}}>
                💵 Cash On Delivery
              </span>
              {!isCodEligible ? (
                <small
                  className="text-danger fw-bold"
                  style={{ fontSize: isMobile ? "0.68rem" : "0.75rem", display: "block", marginTop: isMobile ? "2px" : "0", lineHeight: '1.2' }}
                >
                  {totalAmount < COD_MIN 
                    ? `Add ₹${COD_MIN - totalAmount} more for COD (min ₹${COD_MIN})`
                    : `COD available for orders up to ₹${COD_MAX}. Please pay online.`}
                </small>
              ) : (
                <small
                  className="text-muted"
                  style={{ fontSize: isMobile ? "0.68rem" : "0.75rem", display: "block", marginTop: isMobile ? "2px" : "0", lineHeight: '1.2' }}
                >
                  Pay the full amount when you receive your order
                </small>
              )}
            </div>
          </div>
          <div className={`payment-logos ${!isMobile ? "d-none d-sm-block" : ""}`}>
            <i className="bi bi-cash-stack" style={{ fontSize: isMobile ? "24px" : "32px", color: "#28a745" }}></i>
          </div>
        </div>
      </label>
    </>
  );

  if (isMobile) {
    return <div className="mobile-payment-options mt-2">{content}</div>;
  }

  return (
    <div className="modern-card mb-3 mb-md-4">
      <div className="card-header-clean">
        <div className="d-flex align-items-center">
          <div className="icon-box me-3">
            <i className="fa-regular fa-credit-card"></i>
          </div>
          <div>
            <h5 className="section-title">Payment Method</h5>
            <small className="text-muted">Safe & Secure</small>
          </div>
        </div>
      </div>
      <div className="card-body">
        {content}
      </div>
    </div>
  );
};

export default PaymentMethodSelection;
