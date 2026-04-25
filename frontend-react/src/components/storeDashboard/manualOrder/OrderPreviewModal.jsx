import { createPortal } from "react-dom";

const OrderPreviewModal = ({
  show,
  onClose,
  onConfirm,
  customerDetails,
  cart,
  calculations,
  isLoading,
  orderError,
  paymentMethod,
  setPaymentMethod,
}) => {
  if (!show) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const { subtotal, discountAmount, total } = calculations;

  return createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        zIndex: 10070,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="bg-white rounded-4 shadow-lg overflow-hidden animate-zoom-in d-flex flex-column"
        style={{ width: "90%", maxWidth: "600px", maxHeight: "90vh" }}
      >
        <div className="bg-light p-3 border-bottom d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-white p-2 rounded-circle shadow-sm sd-text-primary">
              <i className="bi bi-receipt-cutoff fs-5"></i>
            </div>
            <div>
              <h5 className="fw-medium m-0 text-dark">Order Summary</h5>
              <p className="text-secondary x-small m-0">
                Verify details before placing order
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        {orderError && (
          <div className="alert alert-danger m-3 mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
            <div className="small">{orderError}</div>
          </div>
        )}

        <div className="p-4 overflow-auto custom-scrollbar">
          <div className="mb-4 bg-light rounded-3 p-3 border">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h6 className="fw-medium text-dark m-0">
                <i className="bi bi-person me-2"></i>Customer Details
              </h6>
              <span
                className={`badge ${customerDetails.orderType === "DELIVERY" ? "sd-bg-primary" : "bg-success"} bg-opacity-10 ${customerDetails.orderType === "DELIVERY" ? "sd-text-primary" : "text-success"} border ${customerDetails.orderType === "DELIVERY" ? "sd-border-primary" : "border-success"} border-opacity-25`}
              >
                {customerDetails.orderType === "DELIVERY"
                  ? "Home Delivery"
                  : "Walk-in"}
              </span>
            </div>
            <div className="row g-2 small">
              <div className="col-sm-6 text-secondary">
                Name:{" "}
                <span className="text-dark fw-medium ms-1">
                  {customerDetails.name.trim() || "Walk In Customer"}
                </span>
              </div>
              <div className="col-sm-6 text-secondary">
                Phone:{" "}
                <span className="text-dark fw-medium ms-1">
                  +91 {customerDetails.phone}
                </span>
              </div>
              {customerDetails.orderType === "DELIVERY" &&
                customerDetails.address && (
                  <div className="col-12 text-secondary mt-2 pt-2 border-top border-light border-opacity-50">
                    <i className="bi bi-geo-alt me-1"></i>
                    {customerDetails.address.house_details},{" "}
                    {customerDetails.address.address_line_2},{" "}
                    {customerDetails.address.city},{" "}
                    {customerDetails.address.postal_code}
                  </div>
                )}
            </div>
          </div>

          <div className="mb-4">
            <h6 className="fw-medium text-dark mb-3">
              <i className="bi bi-basket3 me-2"></i>Items ({cart.length})
            </h6>
            <div className="table-responsive">
              <table className="table table-sm table-borderless align-middle mb-0">
                <thead className="text-secondary border-bottom">
                  <tr>
                    <th className="fw-medium small pb-2">Item</th>
                    <th className="fw-medium small pb-2 text-center">Qty</th>
                    <th className="fw-medium small pb-2 text-end">Price</th>
                    <th className="fw-medium small pb-2 text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr
                      key={item.cartItemId}
                      className="border-bottom border-light"
                    >
                      <td className="ps-0 py-2">
                        <div className="fw-medium text-dark">{item.name}</div>
                        <div
                          className="text-secondary d-flex align-items-center gap-1"
                          style={{ fontSize: "0.7rem" }}
                        >
                          {item.selectedCut !== 'Standard' && item.selectedCut}
                          {item.rawWeight && item.selectedWeight && <span className="text-secondary ms-1">({item.selectedWeight})</span>}
                          {item.cutPrice > 0 && (
                            <span className="text-success ms-1">
                              (+₹{item.cutPrice})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-center py-2">{item.quantity}</td>
                      <td className="text-end py-2">₹{(item.baseWeightPrice || (item.price - item.cutPrice)).toLocaleString()}</td>
                      <td className="text-end py-2 fw-medium">
                        ₹{(((item.baseWeightPrice || (item.price - item.cutPrice)) * item.quantity) + item.cutPrice).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-light rounded-3 p-3 border">
            <div className="d-flex justify-content-between mb-2 small text-secondary">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="d-flex justify-content-between mb-2 small text-success">
                <span>Discount {calculations.couponCode && <span className="badge bg-success bg-opacity-10 text-success ms-1">{calculations.couponCode}</span>}</span>
                <span>-₹{discountAmount.toLocaleString()}</span>
              </div>
            )}
            {calculations.roundOffAmount !== 0 && (
              <div className="d-flex justify-content-between mb-2 small text-danger">
                <span>Rounding Off</span>
                <span>-{calculations.roundOffAmount?.toFixed(2)}</span>
              </div>
            )}
            <div className="d-flex justify-content-between border-top pt-2 mt-2">
              <span className="fw-medium text-dark fs-5">Total Amount</span>
              <span className="fw-medium sd-text-primary fs-5">
                ₹{total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-light rounded-3 p-3 border mt-3">
            <h6 className="fw-medium text-dark mb-2">Payment Method</h6>
            <div className="btn-group w-100 shadow-sm rounded-3 overflow-hidden p-1 bg-white border" role="group">
              <button
                type="button"
                className={`btn btn-sm py-2 border-0 rounded-2 fw-semibold transition-all ${paymentMethod === 'cash' ? 'sd-btn-primary shadow-sm' : 'text-secondary'}`}
                onClick={() => setPaymentMethod("cash")}
              >
                <i className="bi bi-cash-stack me-2"></i>Cash
              </button>
              <button
                type="button"
                className={`btn btn-sm py-2 border-0 rounded-2 fw-semibold transition-all ${paymentMethod === 'upi_online' ? 'sd-btn-primary shadow-sm' : 'text-secondary'}`}
                onClick={() => setPaymentMethod("upi_online")}
              >
                <i className="bi bi-qr-code me-2"></i>UPI Online
              </button>
            </div>
          </div>
        </div>

        <div className="p-3 border-top bg-light d-flex gap-3">
          <button
            className="btn btn-white border flex-grow-1 py-3 fw-medium shadow-sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Edit Order
          </button>
          <button
            className="btn sd-btn-primary flex-grow-1 py-3 fw-medium shadow-soft d-flex align-items-center justify-content-center gap-2"
            onClick={onConfirm}
            disabled={isLoading || customerDetails.phone.length !== 10}
            title={customerDetails.phone.length !== 10 ? "Please enter a valid 10-digit phone number" : ""}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              <>
                Confirm & Print Bill <i className="bi bi-printer ms-2"></i>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default OrderPreviewModal;
