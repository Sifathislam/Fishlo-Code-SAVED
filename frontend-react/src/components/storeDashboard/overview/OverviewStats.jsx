import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function OverviewStats({ stats, isLoading, selectedStatus, onCardClick }) {
  return (
    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-5 g-3 mb-4">
      {/* Pending - Blue */}
      <div className="col">
        <div 
          className="sd-brand-card p-3 h-100 align-items-center"
          onClick={() => onCardClick("PENDING")}
          style={{ cursor: "pointer", border: selectedStatus === "PENDING" ? "2px solid #2563eb" : undefined }}
        >
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 pb-0"
            style={{
              width: "64px",
              height: "64px",
              background: "#dbeafe",
              color: "#2563eb",
            }}
          >
            <i className="bi bi-bag" style={{ fontSize: "1.75rem" }} />
          </div>
          <div className="ms-3">
            <div
              className="fw-semibold text-dark"
              style={{ fontSize: "1.75rem", lineHeight: 1 }}
            >
              {isLoading ? <Skeleton width={40} /> : stats.PENDING}
            </div>
            <div className="text-secondary small fw-medium mt-1">Pending</div>
          </div>
        </div>
      </div>

      {/* Confirmed - Indigo */}
      <div className="col">
        <div 
          className="sd-brand-card p-3 h-100 align-items-center"
          onClick={() => onCardClick("CONFIRMED")}
          style={{ cursor: "pointer", border: selectedStatus === "CONFIRMED" ? "2px solid #4f46e5" : undefined }}
        >
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 pb-0"
            style={{
              width: "64px",
              height: "64px",
              background: "#e0e7ff",
              color: "#4f46e5",
            }}
          >
            <i className="bi bi-check-lg" style={{ fontSize: "1.75rem" }} />
          </div>
          <div className="ms-3">
            <div
              className="fw-semibold text-dark"
              style={{ fontSize: "1.75rem", lineHeight: 1 }}
            >
              {isLoading ? <Skeleton width={40} /> : stats.CONFIRMED || 0}
            </div>
            <div className="text-secondary small fw-medium mt-1">Confirmed</div>
          </div>
        </div>
      </div>

      {/* Processing - Grey */}
      <div className="col">
        <div 
          className="sd-brand-card p-3 h-100 align-items-center"
          onClick={() => onCardClick("PROCESSING")}
          style={{ cursor: "pointer", border: selectedStatus === "PROCESSING" ? "2px solid #475569" : undefined }}
        >
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 pb-0"
            style={{
              width: "64px",
              height: "64px",
              background: "#e2e8f0",
              color: "#475569",
            }}
          >
            <i
              className="bi bi-arrow-repeat"
              style={{ fontSize: "1.75rem" }}
            />
          </div>
          <div className="ms-3">
            <div
              className="fw-semibold text-dark"
              style={{ fontSize: "1.75rem", lineHeight: 1 }}
            >
              {isLoading ? <Skeleton width={40} /> : stats.PROCESSING}
            </div>
            <div className="text-secondary small fw-medium mt-1">
              Processing
            </div>
          </div>
        </div>
      </div>

      {/* Packed (To Pack) - Yellow */}
      <div className="col">
        <div 
          className="sd-brand-card p-3 h-100 align-items-center"
          onClick={() => onCardClick("PACKED")}
          style={{ cursor: "pointer", border: selectedStatus === "PACKED" ? "2px solid #d97706" : undefined }}
        >
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 pb-0"
            style={{
              width: "64px",
              height: "64px",
              background: "#fef3c7",
              color: "#d97706",
            }}
          >
            <i
              className="bi bi-box-seam"
              style={{ fontSize: "1.75rem" }}
            />
          </div>
          <div className="ms-3">
            <div
              className="fw-semibold text-dark"
              style={{ fontSize: "1.75rem", lineHeight: 1 }}
            >
              {isLoading ? <Skeleton width={40} /> : stats.PACKED}
            </div>
            <div className="text-secondary small fw-medium mt-1">Packed</div>
          </div>
        </div>
      </div>

      {/* Out for Delivery (Dispatched) - Cyan */}
      <div className="col">
        <div 
          className="sd-brand-card p-3 h-100 align-items-center"
          onClick={() => onCardClick("OUT_FOR_DELIVERY")}
          style={{ cursor: "pointer", border: selectedStatus === "OUT_FOR_DELIVERY" ? "2px solid #0891b2" : undefined }}
        >
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 pb-0"
            style={{
              width: "64px",
              height: "64px",
              background: "#cffafe",
              color: "#0891b2",
            }}
          >
            <i className="bi bi-truck" style={{ fontSize: "1.75rem" }} />
          </div>
          <div className="ms-3">
            <div
              className="fw-semibold text-dark"
              style={{ fontSize: "1.75rem", lineHeight: 1 }}
            >
              {isLoading ? <Skeleton width={40} /> : stats.OUT_FOR_DELIVERY}
            </div>
            <div className="text-secondary small fw-medium mt-1">
              Out for Delivery
            </div>
          </div>
        </div>
      </div>

      {/* Delivered - Green */}
      <div className="col">
        <div 
          className="sd-brand-card p-3 h-100 align-items-center"
          onClick={() => onCardClick("DELIVERED")}
          style={{ cursor: "pointer", border: selectedStatus === "DELIVERED" ? "2px solid #16a34a" : undefined }}
        >
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 pb-0"
            style={{
              width: "64px",
              height: "64px",
              background: "#dcfce7",
              color: "#16a34a",
            }}
          >
            <i className="bi bi-check2-all" style={{ fontSize: "1.75rem" }} />
          </div>
          <div className="ms-3">
            <div
              className="fw-semibold text-dark"
              style={{ fontSize: "1.75rem", lineHeight: 1 }}
            >
              {isLoading ? <Skeleton width={40} /> : stats.DELIVERED}
            </div>
            <div className="text-secondary small fw-medium mt-1">
              Delivered
            </div>
          </div>
        </div>
      </div>

      {/* Cancelled - Red */}
      <div className="col">
        <div 
          className="sd-brand-card p-3 h-100 align-items-center"
          onClick={() => onCardClick("CANCELLED")}
          style={{ cursor: "pointer", border: selectedStatus === "CANCELLED" ? "2px solid #dc2626" : undefined }}
        >
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 pb-0"
            style={{
              width: "64px",
              height: "64px",
              background: "#fee2e2",
              color: "#dc2626",
            }}
          >
            <i className="bi bi-x-circle" style={{ fontSize: "1.75rem" }} />
          </div>
          <div className="ms-3">
            <div
              className="fw-semibold text-dark"
              style={{ fontSize: "1.75rem", lineHeight: 1 }}
            >
              {isLoading ? <Skeleton width={40} /> : stats.CANCELLED || 0}
            </div>
            <div className="text-secondary small fw-medium mt-1">
              Cancelled
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock (Warning) */}
      <div className="col">
        <div className="sd-brand-card p-3 h-100 d-flex justify-content-between align-items-center">
          <div>
            <div className="text-danger small fw-medium text-uppercase ls-1">Low Stock</div>
            <div className="text-muted small mt-1">Items below threshold</div>
          </div>
          <div className="fw-semibold text-dark fs-2">2</div>
        </div>
      </div>

      {/* Returns (Danger) */}
      <div className="col">
        <div className="sd-brand-card p-3 h-100 d-flex justify-content-between align-items-center">
          <div>
            <div className="text-danger small fw-medium text-uppercase ls-1">Returns</div>
            <div className="text-muted small mt-1">Pending approval</div>
          </div>
          <div className="fw-semibold text-dark fs-2">03</div>
        </div>
      </div>

      {/* Riders (Orange/Red) */}
      <div className="col">
        <div className="sd-brand-card p-3 h-100 d-flex justify-content-between align-items-center">
          <div>
            <div className="text-danger small fw-medium text-uppercase ls-1">Riders</div>
            <div className="text-muted small mt-1">Active on route</div>
          </div>
          <div className="fw-semibold text-dark fs-2">4</div>
        </div>
      </div>
    </div>
  );
}
