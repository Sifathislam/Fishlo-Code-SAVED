import Skeleton from "react-loading-skeleton";

export default function SlotsStatsCard({
  activeSlot,
  summary,
  loading,
  selectedCount = 0,
  onAssignRidersClick,
}) {
  const slotLabel = activeSlot?.label || "—";
  const totalOrders = summary?.total_orders || 0;
  const totalWeight = summary?.total_weight || "0 kg";
  const bikesNeeded = summary?.bikes_needed || 0;
  const pendingDeliveries = summary?.pending_deliveries || 0;

  return (
    <div
      className="bg-white rounded-4 border shadow-sm p-4 mb-4"
      style={{ borderColor: "#e2e8f0" }}
    >
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h6 className="text-dark fw-medium mb-1" style={{ fontSize: "1rem" }}>
            Current Delivery Slot
          </h6>
          <div className="d-flex align-items-center gap-3 mt-2">
            <h3
              className="fw-medium text-dark mb-0 me-3"
              style={{ fontSize: "1.7rem" }}
            >
              {slotLabel}
            </h3>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-white border border-light-subtle btn-sm px-3 fw-medium text-secondary d-flex align-items-center gap-2"
            style={{ fontSize: "0.85rem", borderRadius: "6px" }}
          >
            <i className="bi bi-printer"></i> Print
          </button>
          <button
            className={`btn btn-sm px-3 fw-medium d-flex align-items-center gap-2 ${selectedCount > 0 ? "btn-primary text-white" : "btn-white border border-light-subtle text-secondary"}`}
            style={{ fontSize: "0.85rem", borderRadius: "6px" }}
            onClick={onAssignRidersClick}
            disabled={selectedCount === 0}
          >
            <i className="bi bi-person-plus"></i>
            Assign Rider
            {selectedCount > 0 && (
              <span
                className="badge bg-white text-primary rounded-pill ms-1"
                style={{ fontSize: "0.75rem" }}
              >
                {selectedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-3">
          <div
            className="rounded-3 p-3 d-flex align-items-center gap-3 h-100"
            style={{ backgroundColor: "#eefcf5", border: "1px solid #d1fad6" }}
          >
            <img
              src="/assets/icons/orders-icon.svg"
              alt="orders"
              width="50"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2322c55e'%3E%3Cpath d='M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'/%3E%3C/svg%3E";
              }}
            />
            <div>
              <div className="fw-medium fs-4 text-dark lh-1 mb-1">
                {loading ? (
                  <Skeleton width={60} />
                ) : (
                  <>
                    {totalOrders}{" "}
                    <span className="fs-6 fw-medium text-dark">Orders</span>
                  </>
                )}
              </div>
              <div
                className="text-secondary mt-2"
                style={{ fontSize: "0.9rem" }}
              >
                Total Orders
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div
            className="rounded-3 p-3 d-flex align-items-center gap-3 h-100"
            style={{ backgroundColor: "#fff4f5", border: "1px solid #ffe4e6" }}
          >
            <img
              src="/assets/icons/weight-icon.svg"
              alt="weight"
              width="50"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f43f5e'%3E%3Cpath d='M12 21.05C6.95 21.05 2.85 16.95 2.85 11.9S6.95 2.75 12 2.75 21.15 6.85 21.15 11.9c0 5.05-4.1 9.15-9.15 9.15zM12 4.25c-4.22 0-7.65 3.43-7.65 7.65s3.43 7.65 7.65 7.65 7.65-3.43 7.65-7.65-3.43-7.65-7.65-7.65z'/%3E%3Cpath d='M12 16.7c-2.65 0-4.8-2.15-4.8-4.8S9.35 7.1 12 7.1s4.8 2.15 4.8 4.8-2.15 4.8-4.8 4.8zm0-8.1c-1.82 0-3.3 1.48-3.3 3.3s1.48 3.3 3.3 3.3 3.3-1.48 3.3-3.3-1.48-3.3-3.3-3.3z'/%3E%3C/svg%3E";
              }}
            />
            <div>
              <div className="fw-medium fs-4 text-dark lh-1 mb-1">
                {loading ? <Skeleton width={80} /> : totalWeight}
              </div>
              <div
                className="text-secondary mt-2"
                style={{ fontSize: "0.9rem" }}
              >
                Total Weight
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div
            className="rounded-3 p-3 d-flex align-items-center gap-3 h-100"
            style={{ backgroundColor: "#e6f0ff", border: "1px solid #dbeafe" }}
          >
            <img
              src="/assets/icons/bike-icon.svg"
              alt="bike"
              width="50"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'%3E%3Cpath d='M15.5 12c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m0-2c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm-10 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m0-2c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm13.5-3V5c0-1.1-.9-2-2-2h-3V1h-2v2H11c-1.1 0-2 .9-2 2v2h2V5h3v2h-3l-2.4 3.6c-.4.59-.6 1.29-.6 2h2c0-.37.1-.72.3-1.03L11.5 8h3.38l.62 1.54c.23.58.83.96 1.46.96H19v-2h-1.04l-.46-1.5z'/%3E%3C/svg%3E";
              }}
            />
            <div>
              <div className="fw-medium fs-4 text-dark lh-1 mb-1">
                {loading ? <Skeleton width={40} /> : bikesNeeded} <span className="fs-6 fw-normal text-dark">Bikes</span>
              </div>
              <div
                className="text-secondary mt-2"
                style={{ fontSize: "0.9rem" }}
              >
                Needed
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <button
            className="btn w-100 h-100 rounded-3 p-3 d-flex flex-column align-items-start justify-content-center border-0"
            style={{ backgroundColor: selectedCount === 0 ? "#f8f9fa" : "#fff3cd", opacity: selectedCount === 0 ? 0.6 : 1 }}
            disabled={selectedCount === 0}
            onClick={onAssignRidersClick}
          >
            <div className="d-flex align-items-center gap-3">
              <img
                src="/assets/icons/assign-icon.svg"
                alt="assign"
                width="45"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fbbf24'%3E%3Cpath d='M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
                }}
              />
              <div
                className="fw-medium text-dark text-start"
                style={{ fontSize: "1.05rem", lineHeight: "1.3" }}
              >
                Assign Deliveries
                <br />
                {loading ? <Skeleton width={80} /> : (
                  <span className={pendingDeliveries > 0 ? "text-primary fw-bold" : "text-secondary"}>
                    {pendingDeliveries} Pending
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
