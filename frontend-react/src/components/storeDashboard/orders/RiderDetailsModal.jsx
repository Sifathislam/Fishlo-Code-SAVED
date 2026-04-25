import { createPortal } from "react-dom";

export default function RiderDetailsModal({ riderData, onClose }) {
  if (!riderData || !riderData.assigned_driver) return null;

  const { assigned_driver } = riderData;

  return createPortal(
    <div
      className="sd-modal-overlay"
      onClick={onClose}
    >
      <div
        className="sd-modal-container"
        style={{ maxWidth: "400px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sd-modal-header bg-white pb-3">
          <div className="d-flex justify-content-between align-items-center mb-0 w-100">
            <h5 className="mb-0 fw-medium">Delivery Partner</h5>
            <button
              className="btn btn-close"
              onClick={onClose}
            ></button>
          </div>
        </div>
        <div className="sd-modal-body pt-0 text-center">
          {/* Rider Profile Large */}
          <div className="mb-4 mt-2">
            <div
              className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm pb-0"
              style={{ width: "80px", height: "80px" }}
            >
              <i
                className={`bi bi-${assigned_driver.vehicle === "Bike" ? "bicycle" : "scooter"} text-primary display-4`}
              />
            </div>
            <h4 className="fw-medium mb-1">
              {assigned_driver.name}
            </h4>
            <p className="text-muted mb-0">
              {assigned_driver.phone}
            </p>
            <div className="badge bg-light text-dark border mt-2 px-3 py-2 fw-normal">
              Vehicle No:{" "}
              <span className="fw-medium">
                {assigned_driver.vehicle_no || "----"}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="row g-2 mb-4">
            <div className="col-4">
              <div className="p-2 border rounded bg-light">
                <div className="small text-muted mb-1">Rating</div>
                <div className="fw-medium">
                  <i className="bi bi-star-fill text-warning me-1" />
                  {assigned_driver.rating || "4.5"}
                </div>
              </div>
            </div>
            <div className="col-4">
              <div className="p-2 border rounded bg-light">
                <div className="small text-muted mb-1">Status</div>
                <div className="fw-medium text-success">Active</div>
              </div>
            </div>
            <div className="col-4">
              <div className="p-2 border rounded bg-light">
                <div className="small text-muted mb-1">Trips Today</div>
                <div className="fw-medium">
                  {assigned_driver.jobs || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="d-grid gap-2">
            <a
              href={`tel:${assigned_driver.phone}`}
              className="btn btn-success fw-medium py-2"
            >
              <i className="bi bi-telephone-fill me-2" /> Call Rider
            </a>
            <button
              className="btn btn-outline-secondary py-2"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
