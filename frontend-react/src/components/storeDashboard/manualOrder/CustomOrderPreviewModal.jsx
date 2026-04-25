import { createPortal } from "react-dom";

const CustomOrderPreviewModal = ({
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

  const { subtotal, discountAmount, total, roundOffAmount } = calculations;

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
              <h5 className="fw-medium m-0 text-dark">Review Custom Order</h5>
              <p className="text-secondary x-small m-0">Verify details before placing order</p>
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
          {/* Customer Info */}
          <div className="mb-4 bg-light rounded-3 p-3 border">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h6 className="fw-medium text-dark m-0">
                <i className="bi bi-person me-2"></i>Customer
              </h6>
              <span className={`badge ${customerDetails.orderType === "DELIVERY" ? "sd-bg-primary" : "bg-success"} bg-opacity-10 ${customerDetails.orderType === "DELIVERY" ? "sd-text-primary" : "text-success"} border`}>
                {customerDetails.orderType === "DELIVERY" ? "Delivery" : "Walk-in"}
              </span>
            </div>
            <div className="row g-2 small">
              <div className="col-sm-6 text-secondary">Name: <span className="text-dark fw-medium">{customerDetails.name.trim() || "Walk-in"}</span></div>
              <div className="col-sm-6 text-secondary">Phone: <span className="text-dark fw-medium">+91 {customerDetails.phone}</span></div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-4">
            <h6 className="fw-medium text-dark mb-3">Items ({cart.length})</h6>
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
                  {cart.map((item) => {
                    const isWeighted = item.sell_type === 'WEIGHT';
                    const unitPrice = isWeighted ? (item.price_per_kg || 0) : (item.price_per_piece || 0);
                    const qtyLabel = isWeighted ? `${item.weight}kg` : `${item.quantity} pcs`;
                    const unitLabel = isWeighted ? "/kg" : "/pc";

                    return (
                      <tr key={item.cartItemId} className="border-bottom border-light">
                        <td className="ps-0 py-2">
                          <div className="fw-medium text-dark">{item.name}</div>
                          <div className="text-secondary x-small">
                            {qtyLabel} × ₹{unitPrice}{unitLabel}
                            {item.cut_price > 0 && <span className="text-success ms-1">(+₹{item.cut_price} cut)</span>}
                          </div>
                          {item.note && <div className="text-muted x-small italic mt-1 font-italic">"{item.note}"</div>}
                        </td>
                        <td className="text-center py-2">{item.quantity}</td>
                        <td className="text-end py-2">₹{unitPrice.toLocaleString()}</td>
                        <td className="text-end py-2 fw-medium">
                          ₹{((item.total_price * item.quantity) + (item.cut_price || 0)).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calculations */}
          <div className="bg-light rounded-3 p-3 border">
            <div className="d-flex justify-content-between mb-2 small text-secondary">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="d-flex justify-content-between mb-2 small text-success">
                <span>Discount</span>
                <span>-₹{discountAmount.toLocaleString()}</span>
              </div>
            )}
            {roundOffAmount !== 0 && (
              <div className="d-flex justify-content-between mb-2 small text-danger">
                <span>Rounding Off</span>
                <span>-{roundOffAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="d-flex justify-content-between border-top pt-2 mt-2">
              <span className="fw-bold text-dark fs-5">Total Payable</span>
              <span className="fw-bold sd-text-primary fs-5">₹{total.toLocaleString()}</span>
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
          <button className="btn btn-white border flex-grow-1 py-3 fw-medium" onClick={onClose} disabled={isLoading}>Back</button>
          <button
            className="btn sd-btn-primary flex-grow-1 py-3 fw-bold shadow-soft d-flex align-items-center justify-content-center gap-2"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? <><span className="spinner-border spinner-border-sm"></span> Processing...</> : <>Place Order & Print <i className="bi bi-printer"></i></>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CustomOrderPreviewModal;
