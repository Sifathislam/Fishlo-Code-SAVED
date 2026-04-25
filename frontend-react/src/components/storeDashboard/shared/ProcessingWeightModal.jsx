import React, { useState } from "react";
import { createPortal } from "react-dom";

export default function ProcessingWeightModal({
    isOpen,
    onClose,
    order,
    onConfirmProcessing,
    isProcessing
}) {
    // Only show the modal if there are weighted items.
    const weightedItems = order?.items?.filter((item) => !item.is_packed) || [];

    // State for inputs: map item.id -> { weight_type, weight }
    const [weights, setWeights] = useState({});
    const [errorMsg, setErrorMsg] = useState("");

    if (!isOpen || !order) return null;

    const handleClose = () => {
        if (isProcessing) return;
        setErrorMsg("");
        setWeights({});
        onClose();
    };

    const handleWeightChange = (itemId, field, value) => {
        setWeights((prev) => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                weight_type: prev[itemId]?.weight_type || "kg",
                [field]: value,
            },
        }));
    };

    const handleConfirm = () => {
        setErrorMsg("");

        const payload = [];
        for (const item of weightedItems) {
            const userInp = weights[item.id] || { weight_type: "kg", weight: "" };
            const parsedWeight = parseFloat(userInp.weight);

            if (isNaN(parsedWeight) || parsedWeight <= 0) {
                setErrorMsg(`Please enter a valid weight for ${item.product_name}.`);
                return;
            }

            payload.push({
                order_item_id: item.id,
                weight_type: userInp.weight_type,
                weight: parsedWeight,
            });
        }

        onConfirmProcessing(order.order_number, payload, setErrorMsg);
    };

    return createPortal(
        <div className="sd-modal-overlay no-print" onClick={handleClose}>
            <div 
                className="sd-modal-container" 
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "500px" }}
            >
                {/* Header */}
                <div className="sd-modal-header border-0 bg-white pb-0">
                    <div>
                        <h5 className="mb-1 fw-bold" style={{ color: "var(--fishlo-red)" }}>
                            Process Order
                        </h5>
                        <div className="small text-muted">
                            Order #{order.order_number} • {weightedItems.length} {weightedItems.length === 1 ? 'item' : 'items'} requiring weight
                        </div>
                    </div>
                    <button 
                        className="sd-modal-close" 
                        onClick={handleClose}
                        disabled={isProcessing}
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                <div className="sd-modal-body pt-3 pb-4">
                    {errorMsg && (
                        <div className="alert alert-danger border-0 py-2 px-3 small d-flex align-items-center mb-4" style={{ borderRadius: "12px" }}>
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                            {errorMsg}
                        </div>
                    )}

                    <div className="mb-4">
                        <p className="text-secondary small mb-3">
                            Please verify and enter the final weight for each product before moving to processing.
                        </p>

                        <div className="d-flex flex-column gap-3">
                            {weightedItems.map((item) => (
                                <div 
                                    key={item.id} 
                                    className="p-3 rounded-4 border border-light-subtle bg-light transition-all"
                                    style={{ transition: "all 0.2s" }}
                                >
                                    <div className="d-flex align-items-start gap-3 mb-3">

                                        <div className="overflow-hidden">
                                            <div 
                                                className="fw-semibold text-dark text-truncate mb-0" 
                                                style={{ fontSize: "0.9rem" }}
                                                title={item.product_name}
                                            >
                                                {item.product_name}
                                            </div>
                                            <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                                                <div className="text-muted small">
                                                    Quantity: <span className="fw-medium text-dark">{item.quantity}</span>
                                                </div>
                                                {item.weight && (
                                                    <span
                                                        className="badge fw-medium px-2 py-1"
                                                        style={{
                                                            fontSize: "0.75rem",
                                                            
                                                            color: "var(--fishlo-red)",
                                                            borderRadius: "6px",
                                                        }}
                                                    >
                                                        <i className="bi bi-box-seam me-1" style={{ fontSize: "0.7rem" }} />
                                                        Ordered: {item.weight}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row g-2 align-items-center">
                                        <div className="col-12 mb-1">
                                            <label className="form-label text-muted small fw-medium mb-0">
                                                Enter actual measured weight <strong className="text-danger">per 1 item</strong>:
                                            </label>
                                        </div>
                                        <div className="col-8">
                                            <div className="position-relative">
                                                <input
                                                    type="number"
                                                    className="form-control border-0 shadow-sm fw-medium px-3"
                                                    style={{ 
                                                        height: "44px", 
                                                        borderRadius: "10px",
                                                        fontSize: "0.95rem"
                                                    }}
                                                    placeholder="0.00"
                                                    value={weights[item.id]?.weight || ""}
                                                    onChange={(e) => handleWeightChange(item.id, "weight", e.target.value)}
                                                    disabled={isProcessing}
                                                    min="0.01"
                                                    step="0.01"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <select
                                                className="form-select border-0 shadow-sm fw-medium px-3 text-secondary"
                                                style={{ 
                                                    height: "44px", 
                                                    borderRadius: "10px",
                                                    fontSize: "0.9rem",
                                                    cursor: "pointer"
                                                }}
                                                value={weights[item.id]?.weight_type || "kg"}
                                                onChange={(e) => handleWeightChange(item.id, "weight_type", e.target.value)}
                                                disabled={isProcessing}
                                            >
                                                <option value="kg">kg</option>
                                                <option value="gram">gram</option>
                                            </select>
                                        </div>
                                        {weights[item.id]?.weight && !isNaN(parseFloat(weights[item.id].weight)) && (
                                            <div className="col-12 mt-1">
                                                <div className="text-end small text-muted">
                                                    Total to deduct: <span className="fw-bold text-dark">
                                                        {(parseFloat(weights[item.id].weight) * item.quantity).toFixed(2)} {weights[item.id]?.weight_type || "kg"}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="d-flex gap-3 mt-4 pt-2">
                        <button
                            type="button"
                            className="sd-btn-ghost flex-grow-1"
                            style={{ height: "48px" }}
                            onClick={handleClose}
                            disabled={isProcessing}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="sd-btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                            style={{ height: "48px" }}
                            onClick={handleConfirm}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                                <>
                                    <i className="bi bi-check-circle-fill" />
                                    Confirm & Process
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
