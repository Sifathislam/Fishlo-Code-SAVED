import { useState } from "react";
import { createPortal } from "react-dom";

export default function CancelOrderModal({
    isOpen,
    onClose,
    orderNumber,
    totalAmount,
    onConfirmCancel,
    isCancelling
}) {
    const [cancelReason, setCancelReason] = useState("");
    const [refundType, setRefundType] = useState("NO_REFUND");
    const [refundAmount, setRefundAmount] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    if (!isOpen) return null;

    const handleClose = () => {
        setErrorMsg("");
        setCancelReason("");
        setRefundType("NO_REFUND");
        setRefundAmount("");
        onClose();
    };

    const handleConfirm = () => {
        if (!cancelReason.trim()) {
            setErrorMsg("Cancellation reason is required.");
            return;
        }

        let parsedAmount = null;

        if (refundType === "FULL_REFUND") {
            parsedAmount = totalAmount; // Hardcode on submit regardless of UI tampering
        } else if (refundType === "PARTIAL_REFUND") {
            parsedAmount = parseFloat(refundAmount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                setErrorMsg("Please enter a valid partial refund amount.");
                return;
            }
            if (totalAmount && parsedAmount > totalAmount) {
                setErrorMsg(`Partial refund cannot exceed total amount (₹${totalAmount}).`);
                return;
            }
        }

        setErrorMsg("");

        const payload = {
            reason: cancelReason.trim(),
            refundType: refundType, // will be one of ["FULL_REFUND", "PARTIAL_REFUND", "NO_REFUND"]
            refundAmount: parsedAmount
        };

        // Pass the payload up so the parent can handle the API call and update state
        onConfirmCancel(payload, setErrorMsg);
    };

    return createPortal(
        <div
            className="modal fade show"
            style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
            tabIndex="-1"
            role="dialog"
            aria-labelledby="cancelOrderModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header border-bottom-0 pb-0">
                        <h5 className="modal-title fw-semibold text-danger" id="cancelOrderModalLabel">
                            Cancel Order {orderNumber && `#${orderNumber}`}
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
                        {errorMsg && (
                            <div className="alert alert-danger py-2 px-3 small border-0 d-flex align-items-center mb-3">
                                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                {errorMsg}
                            </div>
                        )}
                        <p className="mb-3 text-muted small">
                            Are you sure you want to cancel this order? This action cannot be undone.
                        </p>

                        <div className="mb-3">
                            <label className="form-label small fw-medium text-dark">Reason <span className="text-danger">*</span></label>
                            <textarea
                                className="form-control form-control-sm border-secondary-subtle"
                                rows="2"
                                placeholder="Provide a reason for cancellation..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                disabled={isCancelling}
                            ></textarea>
                        </div>

                        <div className="mb-3">
                            <label className="form-label small fw-medium text-dark">Refund Type <span className="text-danger">*</span></label>
                            <select
                                className="form-select form-select-sm border-secondary-subtle"
                                value={refundType}
                                onChange={(e) => setRefundType(e.target.value)}
                                disabled={isCancelling}
                            >
                                <option value="NO_REFUND">No Refund</option>
                                <option value="FULL_REFUND">Full Refund</option>
                                <option value="PARTIAL_REFUND">Partial Refund</option>
                            </select>
                        </div>

                        {refundType === "FULL_REFUND" && (
                            <div className="mb-3">
                                <label className="form-label small fw-medium text-dark">Refund Amount (₹) <span className="text-danger">*</span></label>
                                <input
                                    type="number"
                                    className="form-control form-control-sm border-secondary-subtle bg-light"
                                    value={totalAmount || ""}
                                    disabled
                                    readOnly
                                />
                            </div>
                        )}

                        {refundType === "PARTIAL_REFUND" && (
                            <div className="mb-3">
                                <label className="form-label small fw-medium text-dark">Refund Amount (₹) <span className="text-danger">*</span></label>
                                <input
                                    type="number"
                                    className="form-control form-control-sm border-secondary-subtle"
                                    placeholder={`e.g. max ₹${totalAmount || ''}`}
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                    disabled={isCancelling}
                                    min="1"
                                    max={totalAmount}
                                />
                            </div>
                        )}
                    </div>
                    <div className="modal-footer border-top-0 pt-0">
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={handleClose}
                            disabled={isCancelling}
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            className="btn btn-danger d-flex align-items-center justify-content-center"
                            onClick={handleConfirm}
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
                                "Confirm Cancel"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
