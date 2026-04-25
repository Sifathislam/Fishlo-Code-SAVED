import { useState } from "react";
import { createPortal } from "react-dom";
import { useDeliveryMen } from "../../../features/useDeliveryAssignment";
import useDebounce from "../../../shared/hooks/useDebounce";

export default function DeliveryRequestModal({
  isOpen,
  onClose,
  order,
  selectedOrderIds = [],
  onRequestDriver,
  requestedDrivers,
  assignmentError,
  isAssigning,
}) {
  const [dmSearchQuery, setDmSearchQuery] = useState("");
  const [dmFilter, setDmFilter] = useState("ALL");
  const debouncedSearch = useDebounce(dmSearchQuery, 400);

  const { data: ridersData, isLoading: isLoadingRiders, error: ridersError } = useDeliveryMen({
    search: debouncedSearch,
    filters: {
      duty_status: dmFilter === "ACTIVE" ? "ACTIVE" : "",
      vehicle_type: (dmFilter === "Bike" || dmFilter === "Scooter") ? dmFilter : "ALL"
    },
    enabled: isOpen,
  });

  const riders = ridersData?.data || [];

  // Open if we have either a single order or selected order IDs
  const hasOrders = order || (selectedOrderIds && selectedOrderIds.length > 0);
  if (!isOpen || !hasOrders) return null;

  return createPortal(
    <div
      className="sd-modal-overlay"
      onClick={onClose}
    >
      <div
        className="sd-modal-container"
        style={{ maxWidth: "500px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sd-modal-header bg-white pb-3 d-block">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0 fw-medium">
              {selectedOrderIds.length > 0 ? 'Assign Rider' : 'Request Delivery'}
            </h5>
            <button
              className="btn btn-close"
              onClick={onClose}
            ></button>
          </div>

          {/* Selected Order IDs Display */}
          {selectedOrderIds.length > 0 && (
            <div className="mb-3">
              <div className="small text-muted mb-2 fw-medium">Selected Orders ({selectedOrderIds.length})</div>
              <div className="d-flex flex-wrap gap-1">
                {selectedOrderIds.map((id) => (
                  <span key={id} className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 py-1" style={{fontSize: '0.75rem'}}>
                    {id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search & Filter */}
          <div className="d-flex gap-2">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted" />
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Search Name or Phone..."
                value={dmSearchQuery}
                onChange={(e) => setDmSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="form-select form-select-sm"
              style={{ maxWidth: "120px" }}
              value={dmFilter}
              onChange={(e) => setDmFilter(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="Bike">Bike</option>
              <option value="Scooter">Scooter</option>
            </select>
          </div>
          {assignmentError && (
            <div className="alert alert-danger py-2 px-3 mt-3 mb-0 small" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {assignmentError}
            </div>
          )}
        </div>

        <div
          className="sd-modal-body pt-0"
          style={{ maxHeight: "60vh", overflowY: "auto" }}
        >
          <p className="small text-muted mb-2">
            Finding riders near your store...
          </p>
          <div className="list-group list-group-flush">
            {isLoadingRiders ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                <span className="small text-muted">Loading riders...</span>
              </div>
            ) : ridersError ? (
              <div className="text-center py-4 text-danger small">
                {ridersError?.response?.data?.detail || ridersError?.response?.data?.message || ridersError?.message || "Failed to load riders. Please try again."}
              </div>
            ) : riders.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No riders found.
              </div>
            ) : riders.map((dm) => {
              const orderId = order?.id || 'bulk';
              const isRequested = requestedDrivers[
                orderId
              ]?.includes(dm.id);
              return (
                <div
                  key={dm.id}
                  className="list-group-item d-flex justify-content-between align-items-center p-3 border rounded mb-2 shadow-sm"
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="bg-light rounded-circle d-flex align-items-center justify-content-center pb-0"
                      style={{ width: "40px", height: "40px" }}
                    >
                      <i
                        className="bi bi-person text-secondary lead"
                      />
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <div className="fw-medium text-dark">{dm.full_name}</div>
                        {dm.status === "Active" ? (
                          <span
                            className="badge bg-success-subtle text-success p-1 rounded-circle border border-success-subtle"
                            style={{ width: "8px", height: "8px" }}
                          >
                            {" "}
                          </span>
                        ) : (
                          <span
                            className="badge bg-secondary p-1 rounded-circle"
                            style={{ width: "8px", height: "8px" }}
                          >
                            {" "}
                          </span>
                        )}
                        <span className="badge bg-light text-muted border py-1" style={{fontSize: '0.65rem'}}>
                          {dm.vehicle_type}
                        </span>
                      </div>
                      <div className="small text-muted mb-1">
                        {dm.phone}
                      </div>
                      <div className="d-flex gap-2 small text-muted">
                        <span>
                           {dm.zone || "No Zone"}
                        </span>
                        <span>•</span>
                        <span className={dm.is_active_duty ? "text-success" : "text-danger"}>
                          {dm.is_active_duty ? "On Duty" : "Off Duty"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    className={`btn btn-sm ${isRequested ? "btn-success disabled" : "btn-outline-primary"}`}
                    onClick={() =>
                      !isRequested &&
                      dm.status === "Active" &&
                      onRequestDriver(order?.id || 'bulk', dm.id)
                    }
                    disabled={dm.status !== "Active" || isRequested || isAssigning}
                  >
                    {isAssigning && !isRequested ? (
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                    ) : isRequested ? (
                      <>
                        <i className="bi bi-check2 me-1" /> Sent
                      </>
                    ) : (
                      "Request"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
