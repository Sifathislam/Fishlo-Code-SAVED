import { createPortal } from "react-dom";
import { useGetOnlineReceipt } from "../../../features/useStoreReceipts";
import { useUpdatePaymentMethod } from "../../../features/useStoreOrders";
import ReceiptModal from "../manualOrder/ReceiptModal";

const ALLOWED_TRANSITIONS = {
  PENDING: ["CONFIRMED", "PROCESSING", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["CANCELLED"],
  ASSIGNING: ["CANCELLED"],
  ASSIGN: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

import { formatDateTime } from "../../../shared/utils/dateUtils";
import { useEffect, useState } from "react";

export default function OrderDetailsModal({
  order,
  onClose,
  onUpdateStatus,
  onAcceptOrder,
  onCancelClick,
  onProcessingClick, // Optional: Intercept PROCESSING for weight modal
}) {
  const getOnlineReceiptMutation = useGetOnlineReceipt();
  // Local state to track status changes within the modal instantly
  const [localStatus, setLocalStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const updatePaymentMethodMutation = useUpdatePaymentMethod();
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  // Receipt print state
  const [isPrinting, setIsPrinting] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);




  // Sync local status whenever a new order is opened
  useEffect(() => {
    if (order) {
      setLocalStatus(order.status);
    }
  }, [order]);

  if (!order) return null;



  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (newStatus === localStatus) return;

    if (newStatus === "CANCELLED") {
      if (onCancelClick) {
        onCancelClick(order);
      }
      onClose(); // Close the details modal to show the cancel modal
      return;
    }

    if (newStatus === "PROCESSING" && onProcessingClick) {
      // Check if order has weighted (non-packed) items
      const hasWeightedItems = order.items?.some(item => !item.is_packed);
      if (hasWeightedItems) {
        onProcessingClick(order);
        onClose(); // Close the details modal to show the weight modal
        return;
      }
    }

    try {
      setIsUpdating(true);
      setUpdateError("");

      await onUpdateStatus(order.order_number, newStatus);

      setLocalStatus(newStatus);
      onClose(); // Only close on success
    } catch (error) {
      console.error("Update failed", error);
      const msg =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to update status";
      setUpdateError(msg);
      // Do NOT close modal, keep user here to see error
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePaymentMethodChange = async (e) => {
    const newMethod = e.target.value;
    if (newMethod === order.payment_method) return;

    try {
      setIsUpdatingPayment(true);
      setUpdateError("");
      await updatePaymentMethodMutation.mutateAsync({
        orderNumber: order.order_number,
        paymentMethod: newMethod,
      });
    } catch (error) {
      console.error("Payment update failed", error);
      const msg = error?.response?.data?.message || error?.message || "Failed to update payment method";
      setUpdateError(msg);
    } finally {
      setIsUpdatingPayment(false);
    }
  };



  const handlePrintReceipt = async () => {
    try {
      setIsPrinting(true);
      const res = await getOnlineReceiptMutation.mutateAsync(order.order_number);
      if (res?.success && res?.receipt) {
        setReceiptData({ customer: res.receipt });
        setShowReceiptModal(true);
      } else {
        alert("Failed to fetch receipt data.");
      }
    } catch (error) {
      console.error("Print fetch failed", error);
      alert("Error fetching receipt.");
    } finally {
      setIsPrinting(false);
    }
  };


  return createPortal(
    <>
      <div className="sd-modal-overlay no-print" onClick={onClose}>
        <div className="sd-modal-container no-print" onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="sd-modal-header bg-white border-bottom-0 pb-0">
            <div className="overflow-hidden w-100">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2">
                  <h5 className="mb-0 fw-medium">{order.order_number}</h5>
                  <span
                    className={`badge border ${localStatus === "CANCELLED"
                      ? "bg-danger-subtle text-danger border-danger-subtle"
                      : "bg-light text-dark"
                      }`}
                    style={{ paddingTop: "7px" }}
                  >
                    {localStatus}
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary btn-sm border"
                    onClick={handlePrintReceipt}
                    disabled={isPrinting}
                    title="Print Invoice"
                  >
                    {isPrinting ? (
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" style={{ width: '1rem', height: '1rem' }}></span>
                    ) : (
                      <i className="bi bi-printer-fill" />
                    )}
                    <span className="d-none d-sm-inline ms-1">Print</span>
                  </button>
                  <button className="btn btn-close" onClick={onClose}></button>
                </div>
              </div>
              <div className="d-flex gap-3 text-muted small">
                <span>
                  <i className="bi bi-calendar3 me-1" />{" "}
                  {formatDateTime(order.created_at)}
                </span>
                {order.total_weight && (
                  <span>
                    <i className="bi bi-box-seam me-1" /> {order.total_weight}
                  </span>
                )}
              </div>
              {order.delivery_date && order.delivery_date.trim() && (
                <div className={`text-nowrap text-dark "fw-normal"`}>
                  Delivery time - {order.delivery_date}
                </div>
              )}
            </div>
          </div>

          <div className="sd-modal-body pt-3">
            {/* Status Update Selection */}
            <div className="mb-4">
              <label className="form-label fw-medium text-muted small">
                Update Status
              </label>
              <div className="d-flex gap-2" style={{ paddingTop: "7px" }}>
                <select
                  className="form-select"
                  value={localStatus}
                  onChange={handleStatusChange}
                  disabled={
                    localStatus === "CANCELLED" ||
                    localStatus === "DELIVERED" ||
                    isUpdating
                  }
                >
                  <option value={localStatus} className="fw-medium">
                    {localStatus}
                  </option>
                  {(ALLOWED_TRANSITIONS[localStatus] || []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {isUpdating && (
                  <div
                    className="spinner-border spinner-border-sm text-primary mt-2"
                    role="status"
                  ></div>
                )}
              </div>

              {updateError && (
                <div className="alert alert-danger mt-2 mb-0 py-2 small">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {updateError}
                </div>
              )}
              {order.cancellation_reason && (
                <div className="alert alert-danger d-flex align-items-start gap-2 mt-3 mb-0 p-2">
                  <i className="bi bi-info-circle-fill flex-shrink-0 mt-1"></i>
                  <div>
                    <div className="fw-medium">Cancellation Reason:</div>
                    <div className="small">{order.cancellation_reason}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Notes */}
            {order.notes && (
              <div
                className="alert alert-warning border-0 d-flex gap-3 align-items-start mb-3"
                style={{ background: "#fffbeb", color: "#92400e" }}
              >
                <i className="bi bi-exclamation-circle-fill mt-1 flex-shrink-0" />
                <div>
                  <div className="fw-medium small">Customer Note</div>
                  <div className="small lh-sm">{order.notes}</div>
                </div>
              </div>
            )}

            {/* Customer Info Card */}
            <div className="p-3 bg-light rounded mb-3 border border-light">
              <h6 className="fw-medium mb-2">Customer Info</h6>
              <div className="row g-2">
                <div className={`col-12 col-md-6 ${order.purchase_type !== 'WALK_IN_CUSTOMER' ? 'border-end' : ''}`}>
                  <div className="fw-medium">{order.customer?.full_name}</div>
                  <div className="text-muted small mb-1">
                    {order.customer?.phone}
                  </div>
                  <span
                    className={`badge rounded-pill fw-normal px-2 ${order.payment_method === "Razorpay" || order.payment_method === "UPI_ONLINE" ? "bg-success-subtle text-success border border-success-subtle" : order.payment_method === "COD" ? "bg-info-subtle text-info-emphasis border border-info-subtle" : "bg-warning-subtle text-warning-emphasis border border-warning-subtle"}`}
                  >
                    <i
                      className={`bi ${order.payment_method === "Razorpay" || order.payment_method === "UPI_ONLINE" ? "bi-credit-card" : order.payment_method === "CASH" ? "bi-cash-coin" : order.payment_method === "COD" ? "bi-cash-stack" : "bi-cash"} me-1`}
                    />
                    {order.payment_method === "Razorpay"
                      ? "Online Payment"
                      : order.payment_method === "UPI_ONLINE"
                        ? "UPI Online"
                        : order.payment_method === "CASH"
                          ? "Cash"
                          : order.payment_method === "COD"
                            ? "Cash On Delivery"
                            : "Pay on Delivery"}
                  </span>

                  {/* Payment Method Update Dropdown - Only for Cash/UPI Online, not Online/Razorpay */}
                  {localStatus !== "CANCELLED" && (order.payment_method === "CASH" || order.payment_method === "UPI_ONLINE") && (
                    <div className="mt-2 d-flex align-items-center gap-2">
                      <select
                        className="form-select form-select-sm w-auto border-secondary-subtle"
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                        value={order.payment_method}
                        onChange={handlePaymentMethodChange}
                        disabled={isUpdatingPayment}
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI_ONLINE">UPI Online</option>
                      </select>
                      {isUpdatingPayment && (
                        <div className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: "0.8rem", height: "0.8rem" }}></div>
                      )}
                    </div>
                  )}
                  <span
                    className={`badge rounded-pill fw-normal px-2 ms-1 ${order.payment_status === "PAID"
                      ? "bg-success-subtle text-success border-success-subtle"
                      : order.payment_status === "FAILED"
                        ? "bg-danger-subtle text-danger border-danger-subtle"
                        : "bg-warning-subtle text-warning-emphasis border-warning-subtle"
                      }`}
                  >
                    {order.payment_status}
                  </span>
                </div>
                {order.source !== 'MANUAL_STORE' && order.purchase_type !== 'WALK_IN_CUSTOMER' && (
                  <div className="col-12 col-md-6 ps-md-3">
                    <div className="small text-muted mb-1">Address:</div>
                    <div className="small text-dark lh-sm">
                      {order.customer?.get_full_address}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Items List */}
            <h6 className="fw-medium mb-2">Order Items</h6>
            <div className="list-group mb-3 border-0">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="list-group-item d-flex justify-content-between align-items-center border-0 border-bottom px-1 py-3"
                >
                  <div className="d-flex align-items-center gap-3 overflow-hidden">
                    <div className="text-truncate">
                      <div
                        className="fw-medium text-dark mb-1"
                        style={{
                          fontSize: "0.85rem",
                          display: "-webkit-box",
                          WebkitLineClamp: "2",
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: "1.2",
                        }}
                        title={item.product_name}
                      >
                        {item.product_name}
                      </div>

                      <div className="text-muted small mt-1 d-flex gap-2 align-items-center flex-wrap">
                        {!item.is_packed && (
                          <span className="badge bg-light text-dark border fw-normal py-1 px-2">
                            Qty: <span className="fw-medium">{item.quantity}</span>
                          </span>
                        )}

                        {item.weight && (
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-medium py-1 px-2">

                            {item.weight}
                          </span>
                        )}

                        {item.selected_cuts?.map((cut, cutIdx) => (
                          <span
                            key={cutIdx}
                            className="badge bg-white text-secondary border fw-normal rounded-pill px-2 py-1 d-flex align-items-center gap-1"
                            style={{
                              fontSize: "0.7rem",

                            }}
                          >
                            {cut.name}
                            {cut.price > 0 && (
                              <span className="text-success fw-medium border-start ps-1">
                                +₹{cut.price}
                              </span>
                            )}
                          </span>
                        ))}

                        {item.is_custom && (item.custom_note || item.cut_price > 0) && (
                          <span
                            className="badge bg-white text-secondary border fw-normal rounded-pill px-2 py-1 d-flex align-items-center gap-1"
                            style={{
                              fontSize: "0.7rem",
                            }}
                          >
                            {item.custom_note || "Custom Cut"}
                            {item.cut_price > 0 && (
                              <span className="text-success fw-medium border-start ps-1">
                                +₹{item.cut_price}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-end flex-shrink-0 ms-2">
                    <div className="fw-medium">₹{item.subtotal}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bill Footer */}
            <div className="d-flex justify-content-between align-items-center pt-3 border-top bg-light mx-n3 px-3 pb-3 mb-n3 rounded-bottom">
              <div className="w-100 pe-3">
                {order.price_details && (
                  <>
                    <div className="d-flex justify-content-between mb-1 small">
                      <span className="text-muted">Subtotal</span>
                      <span className="fw-medium">₹{order.price_details.subtotal}</span>
                    </div>
                    {order.price_details.delivery_fee > 0 && (
                      <div className="d-flex justify-content-between mb-1 small">
                        <span className="text-muted">Delivery Fee</span>
                        <span className="fw-medium">₹{order.price_details.delivery_fee}</span>
                      </div>
                    )}
                    {/* {order.price_details.gst_amount > 0 && (
                    <div className="d-flex justify-content-between mb-1 small">
                      <span className="text-muted">
                        GST ({order.price_details.gst_percentage}%)
                      </span>
                      <span className="fw-medium">₹{order.price_details.gst_amount}</span>
                    </div>
                  )} */}
                    {order.price_details.discount_value > 0 && (
                      <div className="d-flex justify-content-between mb-1 small">
                        <span className="text-muted">
                          Discount
                          {order.price_details.discount_code && (
                            <span className="badge bg-success-subtle text-success ms-1 fw-normal" style={{ fontSize: "0.65rem" }}>
                              {order.price_details.discount_code}
                            </span>
                          )}
                        </span>
                        <span className="fw-medium text-success">-₹{order.price_details.discount_value}</span>
                      </div>
                    )}
                    {order.price_details.adjustable_amount > 0 && (
                      <div className="d-flex justify-content-between mb-1 small">
                        <span className="text-secondary">Rounding Off</span>
                        <span className="fw-medium">₹{order.price_details.adjustable_amount}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between mb-1 pt-2 border-top mt-2">
                      <span className="text-muted small d-flex align-items-center">
                        <i className="bi bi-receipt me-2 fs-6" /> Total
                      </span>
                      <span className="fw-medium">₹{order.price_details.total_amount || order.price_details.total_paid}</span>
                    </div>

                    {order.payment_method === "COD" && (
                      <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2">
                        <div>
                          <span className="fw-medium text-dark d-block" style={{ lineHeight: 1 }}>
                            To Collect (COD)
                          </span>
                          <span className="small text-muted" style={{ fontSize: "0.75rem" }}>
                            Full Amount
                          </span>
                        </div>
                        <span className="h5 mb-0 fw-medium text-danger">
                          ₹{order.price_details.total_amount}
                        </span>
                      </div>
                    )}

                    {/* {order.price_details.is_partial_pay && (
                      <>
                        <div className="d-flex justify-content-between mb-1 small">
                          <span className="text-secondary">Paid Online</span>
                          <span className="text-success fw-medium">₹{order.price_details.partial_pay}</span>
                        </div>
                        {parseFloat(order.price_details.cash_collected) > 0 && (
                          <div className="d-flex justify-content-between mb-1 small">
                            <span className="text-secondary">Cash Collected</span>
                            <span className="text-success fw-medium">₹{order.price_details.cash_collected}</span>
                          </div>
                        )}
                        {parseFloat(order.price_details.remaining_amount) > 0 ? (
                          <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2">
                            <div>
                              <span className="fw-medium text-dark d-block" style={{ lineHeight: 1 }}>
                                To Collect
                              </span>
                              <span className="small text-muted" style={{ fontSize: "0.75rem" }}>
                                From Customer
                              </span>
                            </div>
                            <span className="h5 mb-0 fw-medium text-danger">
                              ₹{order.price_details.remaining_amount}
                            </span>
                          </div>
                        ) : (
                          <div className="d-flex justify-content-between align-items-center pt-1 border-top mt-2">
                            <span className="fw-bold text-success small">
                              <i className="bi bi-check-circle-fill me-1"></i> Fully Paid
                            </span>
                          </div>
                        )}
                      </>
                    )} */}
                  </>
                )}
              </div>
              <div className="flex-shrink-0 ps-3 border-start">
                {localStatus === "PENDING" && onAcceptOrder && (
                  <button
                    className="btn btn-primary px-4 py-2 fw-medium w-100 mb-2"
                    onClick={async () => {
                      try {
                        setIsUpdating(true);
                        setUpdateError("");
                        await onAcceptOrder(order.order_number);
                        setLocalStatus("CONFIRMED");
                        onClose();
                      } catch (error) {
                        console.error("Accept failed", error);
                        const msg =
                          error?.response?.data?.detail ||
                          error?.message ||
                          "Failed to accept order";
                        setUpdateError(msg);
                      } finally {
                        setIsUpdating(false);
                      }
                    }}
                    disabled={isUpdating}
                  >
                    Accept Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ReceiptModal
        show={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receiptData={receiptData}
        isSilent={false}
        autoPrint={true}
      />
    </>,
    document.body,
  );
}
