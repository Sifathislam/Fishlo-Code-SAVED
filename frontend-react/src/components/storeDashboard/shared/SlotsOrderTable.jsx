import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { formatDateTime } from "../../../shared/utils/dateUtils";

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

export default function SlotsOrderTable({
  orders,
  loading,
  isFetching,
  activeSlot,
  setSelectedOrderId,
  setCancelModalOrder,
  onProcessingClick, // Optional: Intercept PROCESSING for weight modal
  handleUpdateClick,
  blinkingRows,
  selectedOrderIds = new Set(),
  onToggleSelect,
  onToggleSelectAll,
}) {
  const packedOrders = orders.filter((o) => o.status === "PACKED");
  const allSelected =
    packedOrders.length > 0 && selectedOrderIds.size === packedOrders.length;
  const someSelected =
    selectedOrderIds.size > 0 && selectedOrderIds.size < packedOrders.length;

  return (
    <div
      className="bg-white rounded-4 border shadow-sm"
      style={{ borderColor: "#e2e8f0" }}
    >
      <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
        <h6
          className="fw-medium text-uppercase text-dark mb-0 ls-1 d-flex align-items-center gap-2"
          style={{ fontSize: "0.95rem" }}
        >
          Orders for {activeSlot?.label || "—"} Slot
          {isFetching && (
            <div
              className="spinner-border text-primary"
              role="status"
              style={{ width: "1rem", height: "1rem", borderWidth: "0.15em" }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
          )}
        </h6>
        <div className="d-flex align-items-center gap-3">
          {selectedOrderIds.size > 0 && (
            <span
              className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-2"
              style={{ fontSize: "0.8rem" }}
            >
              {selectedOrderIds.size} selected
            </span>
          )}
          <div className="text-secondary small fw-medium">
            {orders.length} orders
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table
          className="table align-middle mb-0"
          style={{ fontSize: "0.9rem" }}
        >
          <thead
            className="bg-white text-secondary small fw-medium text-uppercase border-bottom"
            style={{ letterSpacing: "0.5px", borderBottomColor: "#e2e8f0" }}
          >
            <tr>
              <th className="ps-4 py-3 border-0" style={{ width: "50px" }}>
                <div
                  onClick={
                    packedOrders.length > 0 ? onToggleSelectAll : undefined
                  }
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "6px",
                    border:
                      allSelected || someSelected
                        ? "2px solid #3b82f6"
                        : "2px solid #cbd5e1",
                    backgroundColor: allSelected
                      ? "#3b82f6"
                      : someSelected
                        ? "#dbeafe"
                        : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: packedOrders.length > 0 ? "pointer" : "default",
                    opacity: packedOrders.length > 0 ? 1 : 0.4,
                    transition: "all 0.15s ease",
                  }}
                >
                  {allSelected && (
                    <i
                      className="bi bi-check"
                      style={{ color: "#fff", fontSize: "14px", lineHeight: 1 }}
                    ></i>
                  )}
                  {someSelected && !allSelected && (
                    <div
                      style={{
                        width: "10px",
                        height: "2.5px",
                        backgroundColor: "#3b82f6",
                        borderRadius: "1px",
                      }}
                    ></div>
                  )}
                </div>
              </th>
              <th className="py-3 border-0">Order #</th>
              <th className="py-3 border-0">Customer</th>
              <th className="py-3 border-0">Area</th>
              <th className="py-3 border-0 pe-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Skeleton Loading State
              Array.from({ length: 4 }).map((_, index) => (
                <tr key={index} className="border-bottom border-light-subtle">
                  <td className="ps-4 py-4 border-0">
                    <Skeleton width={18} height={18} />
                  </td>
                  <td className="py-4 border-0">
                    <Skeleton width={100} height={20} className="mb-2" />
                    <Skeleton width={140} height={15} />
                  </td>
                  <td className="py-4 border-0">
                    <Skeleton width={120} height={20} className="mb-2" />
                    <Skeleton width={100} height={15} />
                  </td>
                  <td className="py-4 border-0">
                    <Skeleton width={160} height={35} />
                  </td>
                  <td className="py-4 border-0">
                    <Skeleton width={80} height={20} className="mb-2" />
                    <Skeleton width={90} height={24} borderRadius={12} />
                  </td>
                  <td className="py-4 border-0 pe-4">
                    <Skeleton width={120} height={32} borderRadius={6} />
                  </td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-5">
                  <div className="text-secondary d-flex flex-column align-items-center justify-content-center">
                    <i className="bi bi-inbox fs-1 mb-2 text-light-emphasis"></i>
                    <h6 className="fw-medium text-dark mb-1">
                      No orders found
                    </h6>
                    <p className="small mb-0">
                      There are no orders for this delivery slot.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order, idx) => (
                <tr
                  key={order.id}
                  className={`border-bottom border-light-subtle sd-hover-row ${selectedOrderIds.has(order.order_number) ? "sd-row-selected" : ""} ${blinkingRows.has(order.order_number) ? "row-blink-active" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    if (
                      e.target.closest(".status-column") ||
                      e.target.closest(".checkbox-column")
                    )
                      return;
                    setSelectedOrderId(order.order_number);
                  }}
                >
                  <td
                    className="ps-4 py-4 border-0 checkbox-column"
                    style={{ width: "50px" }}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (order.status === "PACKED")
                          onToggleSelect(order.order_number);
                      }}
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "6px",
                        border: selectedOrderIds.has(order.order_number)
                          ? "2px solid #3b82f6"
                          : "2px solid #cbd5e1",
                        backgroundColor: selectedOrderIds.has(
                          order.order_number,
                        )
                          ? "#3b82f6"
                          : "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor:
                          order.status === "PACKED" ? "pointer" : "default",
                        opacity: order.status === "PACKED" ? 1 : 0.3,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {selectedOrderIds.has(order.order_number) && (
                        <i
                          className="bi bi-check"
                          style={{
                            color: "#fff",
                            fontSize: "14px",
                            lineHeight: 1,
                          }}
                        ></i>
                      )}
                    </div>
                  </td>
                  <td className="py-4 border-0">
                    <div className="fw-medium text-dark mb-1">
                      {order.order_number}
                    </div>
                    <div className="text-secondary small">
                      {formatDateTime(order.created_at)}
                    </div>
                  </td>
                  <td className="py-4 border-0">
                    <div className="fw-medium text-dark mb-1">
                      {order.customer?.full_name || "Guest"}
                    </div>
                    <div className="text-secondary small">
                      {order.customer?.phone}
                    </div>
                  </td>
                  <td className="py-4 border-0">
                    <div
                      className="fw-medium text-dark mb-1"
                      style={{
                        maxWidth: "200px",
                        display: "-webkit-box",
                        WebkitLineClamp: "2",
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: "1.2em", // Adjust based on your font size
                        height: "2.4em", // (lineHeight * 2) Ensures consistent row height
                      }}
                      title={
                        order.source === 'MANUAL_STORE'
                          ? "Walk-in"
                          : order.customer?.get_full_address || "No Address Provided"
                      }
                    >
                      {order.source === 'MANUAL_STORE'
                        ? "Walk-in"
                        : order.customer?.get_full_address || "No Address Provided"}
                    </div>
                  </td>
                  <td className="py-4 border-0">
                    <div className="fw-medium text-dark mb-1 fs-6">
                      ₹ {order.price_details?.total_paid}
                    </div>
                    <span
                      className={`badge border rounded-pill ${
                        order.payment_method === "CASH" || order.payment_method === "COD"
                          ? "bg-warning-subtle text-warning-emphasis border-warning-subtle"
                          : order.payment_status === "PAID"
                            ? "bg-success-subtle text-success border-success-subtle"
                            : order.payment_status === "FAILED"
                              ? "bg-danger-subtle text-danger border-danger-subtle"
                              : order.payment_status === "REFUNDED"
                                ? "bg-secondary-subtle text-secondary border-secondary-subtle"
                                : order.payment_status === "PARTIALLY_PAID"
                                  ? "bg-info-subtle text-info-emphasis border-info-subtle"
                                  : "bg-warning-subtle text-warning-emphasis border-warning-subtle"
                      }`}
                      style={{ fontSize: "0.65rem", padding: "0.25rem 0.5rem" }}
                    >
                      {order.payment_method === "CASH"
                        ? "Cash"
                        : order.payment_method === "COD"
                          ? "COD"
                          : order.payment_method === "UPI_ONLINE"
                            ? "UPI Online"
                            : order.payment_status === "PARTIALLY_PAID"
                              ? "PARTIAL PAID"
                              : order.payment_status === "PAID"
                                ? "Online"
                                : order.payment_status}
                    </span>
                  </td>
                  <td className="py-4 border-0 pe-4 status-column">
                    {/* Status Dropdown */}
                    <div className="dropdown">
                      <button
                        className={`btn btn-sm dropdown-toggle w-100 fw-medium border-0 d-flex justify-content-between align-items-center rounded-2 py-2 px-3 ${
                          order.status === "PENDING"
                            ? "btn-warning"
                            : order.status === "CANCELLED"
                              ? "btn-danger-subtle text-danger border-danger-subtle"
                              : "btn-light border"
                        }`}
                        type="button"
                        data-bs-toggle="dropdown"
                        style={
                          order.status === "PENDING"
                            ? {
                                fontSize: "0.8rem",
                                backgroundColor: "#fbbf24",
                                color: "#1f2937",
                              }
                            : { fontSize: "0.8rem" }
                        }
                        disabled={
                          order.status === "CANCELLED" ||
                          order.status === "DELIVERED"
                        }
                      >
                        {order.status}
                      </button>
                      <ul className="dropdown-menu shadow-sm border-0">
                        {(ALLOWED_TRANSITIONS[order.status] || []).map((s) => (
                          <li key={s}>
                            <button
                              className="dropdown-item small"
                              onClick={(e) => {
                                e.stopPropagation();
                                document.body.click(); // Close dropdown by simulating outside click
                                if (s === "CANCELLED") {
                                  setCancelModalOrder(order);
                                } else if (s === "PROCESSING" && onProcessingClick) {
                                  // Check if order has weighted (non-packed) items
                                  const hasWeightedItems = order.items?.some(item => !item.is_packed);
                                  if (hasWeightedItems) {
                                    onProcessingClick(order);
                                  } else {
                                    handleUpdateClick(order.order_number, s);
                                  }
                                } else {
                                  handleUpdateClick(order.order_number, s);
                                }
                              }}
                            >
                              {s}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
