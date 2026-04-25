import { useState } from "react";
import { useCancelOrderWithRefund } from "../../features/useCreateOrder";

export default function CancelOrderModal({
  isOpen,
  onClose,
  orderNumber,
  orderStatus,
  onSuccess,
}) {
  const { mutate: cancelOrder, isPending: isCancelling } =
    useCancelOrderWithRefund();
  const [cancelReason, setCancelReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [globalErrorMsg, setGlobalErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    setGlobalErrorMsg("");
    setReasonError("");
    setCancelReason("");
    onClose();
  };

  const handleReasonChange = (e) => {
    const value = e.target.value;
    // Regex to match emojis and some special symbol blocks
    const emojiRegex =
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

    let cleanedValue = value.replace(emojiRegex, "");

    if (cleanedValue.length > 150) {
      cleanedValue = cleanedValue.substring(0, 150);
    }

    setCancelReason(cleanedValue);

    if (reasonError) {
      setReasonError("");
    }
  };

  const confirmCancelOrder = () => {
    setGlobalErrorMsg("");
    setReasonError("");

    if (!cancelReason.trim()) {
      setReasonError("Cancellation reason is required.");
      return;
    }

    if (cancelReason.trim().length < 5) {
      setReasonError(
        "Please provide a more detailed reason (minimum 5 characters).",
      );
      return;
    }

    // Extra strict check
    if (orderStatus !== "PENDING" && orderStatus !== "CONFIRMED") {
      setGlobalErrorMsg("This order cannot be cancelled anymore.");
      return;
    }

    cancelOrder(
      { orderNumber, reason: cancelReason.trim() },
      {
        onSuccess: () => {
          if (onSuccess) onSuccess();
          handleClose();
        },
        onError: (error) => {
          const message =
            error?.response?.data?.message ||
            "Failed to cancel the order. Please try again.";
          setGlobalErrorMsg(message);
          console.error("Cancellation error:", error);
        },
      },
    );
  };

  return (
    <div
      className="modal fade show"
      style={{
        display: "block",
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1055,
      }}
      tabIndex="-1"
      role="dialog"
      aria-labelledby="cancelOrderModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-semibold" id="cancelOrderModalLabel">
              Cancel Order
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              aria-label="Close"
              disabled={isCancelling}
            ></button>
          </div>
          <div className="modal-body py-4">
            {globalErrorMsg && (
              <div className="alert alert-danger py-2 px-3 small border-0 d-flex align-items-center mb-3">
                <i className="fas fa-exclamation-circle me-2"></i>
                {globalErrorMsg}
              </div>
            )}
            <p className="mb-3 text-muted small">
              Are you sure you want to cancel Order{" "}
              <strong>#{orderNumber}</strong>?
            </p>

            <div className="mb-3">
              <label className="form-label small fw-medium text-dark">
                Reason <span className="text-danger">*</span>
              </label>
              <textarea
                className={`form-control form-control-sm border-secondary-subtle ${reasonError ? "is-invalid" : ""}`}
                rows="2"
                placeholder="Provide a reason for cancellation..."
                value={cancelReason}
                onChange={handleReasonChange}
                disabled={isCancelling}
                maxLength="150"
              ></textarea>
              {reasonError && (
                <div className="invalid-feedback d-block">
                  <i className="fas fa-exclamation-circle me-1"></i>
                  {reasonError}
                </div>
              )}
              <div className="form-text text-end small">
                {cancelReason.length}/150
              </div>
            </div>
          </div>
          <div className="modal-footer border-0 pt-0">
            <button
              type="button"
              className="btn btn-light"
              onClick={handleClose}
              disabled={isCancelling}
            >
              No, Keep it
            </button>
            <button
              type="button"
              className="btn btn-danger d-flex align-items-center justify-content-center"
              onClick={confirmCancelOrder}
              disabled={isCancelling}
              style={{ minWidth: "120px" }}
            >
              {isCancelling ? (
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
              ) : (
                "Yes, Cancel"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
