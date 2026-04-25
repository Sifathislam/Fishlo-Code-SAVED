import { Navigate, useLocation, useNavigate } from "react-router-dom";
import "../styles/PaymentStatus.css";

const OrderFailure = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (!location?.state || !location?.state?.orderNumber) {
    return <Navigate to="/" />;
  }

  const { orderNumber, amount } = location.state || {};

  return (
    <div className="fishlo-page-wrapper">
      <title>Order Failed | Fishlo</title>
      {/* Main Content Container */}
      <div className="order-failure-status-container">
        <div className="order-failure-payment-card">
          <div className="row g-0">
            {/* Left Side: Status Summary */}
            <div className="col-lg-5 order-failure-summary-side">
              <div className="order-failure-icon-box">
                <div className="order-failure-main-circle">
                  <i className="bi bi-x-lg"></i>
                </div>
              </div>

              <h2 className="fw-medium mb-1">Payment Failed</h2>
              <p className="text-muted small mb-4">
                The transaction was declined by the gateway.
              </p>

              <div className="order-failure-id-pill mb-2">#{orderNumber}</div>
              <div className="order-failure-price-tag">₹{amount}</div>

              <div className="px-2 px-md-4 mt-4">
                <button
                  className="order-failure-btn-retry-main"
                  onClick={() => navigate("/checkout")}
                >
                  Try Again
                </button>
                <div
                  className="d-block mt-3 text-decoration-none text-muted fw-medium small"
                  onClick={() => navigate("/checkout")}
                  style={{ cursor: "pointer" }}
                >
                  <i className="bi bi-chevron-left me-1"></i> Return to Checkout
                </div>
              </div>

              <div
                className="mt-4 mt-lg-5 text-muted px-2"
                style={{ fontSize: "11px" }}
              >
                <i className="bi bi-shield-check text-success me-1"></i>
                Money is secure. Refunds are processed within 5-7 days.
              </div>
            </div>

            {/* Right Side: Diagnostics */}
            <div className="col-lg-7 order-failure-diagnostic-side">
              <h5 className="fw-medium mb-4">Why did it fail?</h5>

              <div className="order-failure-info-card d-flex align-items-start">
                <div
                  className="flex-shrink-0 me-3"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "#fff5f5",
                    color: "#e74c3c",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i className="bi bi-wifi-off"></i>
                </div>
                <div>
                  <h6 className="mb-1 fw-medium">Connection Lost</h6>
                  <p className="small text-muted mb-0">
                    The session timed out due to unstable internet or bank
                    server issues.
                  </p>
                </div>
              </div>

              <div className="order-failure-info-card d-flex align-items-start">
                <div
                  className="flex-shrink-0 me-3"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "#fff5f5",
                    color: "#e74c3c",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i className="bi bi-shield-lock-fill"></i>
                </div>
                <div>
                  <h6 className="mb-1 fw-medium">Authentication Failed</h6>
                  <p className="small text-muted mb-0">
                    Incorrect OTP, UPI PIN, or bank-side cancellation.
                  </p>
                </div>
              </div>

              <h5 className="fw-medium mt-4 mt-lg-5 mb-3">Suggested for you</h5>
              <div className="row g-2">
                <div className="col-6">
                  <div className="p-3 border rounded-3 bg-white h-100">
                    <i className="bi bi-credit-card-2-back text-danger mb-2 d-block"></i>
                    <span className="small fw-medium d-block">
                      Other Method
                    </span>
                    <span
                      className="text-muted d-none d-md-block"
                      style={{ fontSize: "10px" }}
                    >
                      Try Cards or Netbanking.
                    </span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 border rounded-3 bg-white h-100">
                    <i className="bi bi-cash-stack text-danger mb-2 d-block"></i>
                    <span className="small fw-medium d-block">Check Funds</span>
                    <span
                      className="text-muted d-none d-md-block"
                      style={{ fontSize: "10px" }}
                    >
                      Verify your bank balance.
                    </span>
                  </div>
                </div>
              </div>

              {/* Support Section */}
              <div className="mt-4 mt-lg-5">
                <div className="order-failure-support-strip">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-headset me-3 fs-4 text-muted"></i>
                    <div className="text-start">
                      <div className="small fw-medium">Need Help?</div>
                      <div className="small text-muted">+919619600049</div>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-outline-dark rounded-pill px-4">
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFailure;
