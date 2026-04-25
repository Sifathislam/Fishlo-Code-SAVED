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

import { useCallback, useState } from "react";
import { formatDateTime } from "../../../shared/utils/dateUtils";

export default function OrderTable({
  orders,
  onViewOrder,
  onUpdateStatus,
  onCancelClick,
  onProcessingClick, // Optional: Intercept PROCESSING for weight modal
  onAssignDriver, // Optional: Only for Orders Page
  showAssignAction = false, // Toggle Assign button
}) {
  const [blinkingRows, setBlinkingRows] = useState(new Set());

  const handleUpdateClick = useCallback(
    async (orderId, newStatus, reason) => {
      try {
        if (reason) await onUpdateStatus(orderId, newStatus, reason);
        else await onUpdateStatus(orderId, newStatus);

        setBlinkingRows((prev) => {
          const next = new Set(prev);
          next.add(orderId);
          return next;
        });
        setTimeout(() => {
          setBlinkingRows((prev) => {
            const next = new Set(prev);
            next.delete(orderId);
            return next;
          });
        }, 2500);
      } catch (error) {
        console.error("Failed to update status", error);
        throw error;
      }
    },
    [onUpdateStatus],
  );

  return (
    <div className="table-responsive">
      <table className="sd-table">
        <thead>
          <tr>
            <th style={{ minWidth: "100px" }}>Order #</th>
            <th style={{ minWidth: "140px" }}>Customer</th>
            {/* <th style={{ minWidth: "250px" }}>Items Summary</th> */}
            <th style={{ minWidth: "210px" }}>Delivery Time</th>
            <th style={{ minWidth: "130px" }}>Payment</th>
            <th style={{ minWidth: "120px" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center py-5 text-muted">
                No orders found
              </td>
            </tr>
          ) : (
            orders.map((order) => {
              const isUnread =
                order.status === "PENDING" || order.is_read === false;
              return (
                <tr
                  key={order.id}
                  className={`${blinkingRows.has(order.order_number) ? "row-blink-active" : ""} ${!isUnread ? "sd-hover-row" : "bg-white"}`}
                  style={
                    isUnread
                      ? {
                          backgroundColor: "#f0f7ff",
                          boxShadow: "inset 4px 0 0 #0d6efd",
                          cursor: "pointer",
                        }
                      : { cursor: "pointer" }
                  }
                  onClick={(e) => {
                    if (e.target.closest(".status-column")) return;
                    onViewOrder(order);
                  }}
                >
                  <td>
                    <div
                      className={`text-nowrap text-dark ${isUnread ? "fw-mediumer" : "fw-normal"}`}
                    >
                      {order.order_number}
                    </div>
                    <div
                      className={`sd-user-meta ${isUnread ? "text-dark fw-medium" : ""}`}
                    >
                      {formatDateTime(order.created_at)}
                    </div>
                  </td>
                  <td>
                    <div
                      className={`sd-user-name text-truncate ${isUnread ? "fw-mediumer text-dark" : "text-muted"}`}
                      style={{ maxWidth: "140px" }}
                    >
                      {order.customer?.full_name}
                    </div>
                    <div className="sd-user-meta">{order.customer?.phone}</div>
                  </td>
                  <td>
                    <div
                      className={`text-dark ${isUnread ? "fw-mediumer" : "fw-normal"}`}
                    >
                      {order.delivery_date && order.delivery_date.trim() ? (
                        order.delivery_date
                          .split(" ")
                          .map((part, index) => (
                            <div key={index}>
                              {/* This renders the date on line 1, and the time range on line 2 */}
                              {index === 0
                                ? part
                                : order.delivery_date.substring(
                                    order.delivery_date.indexOf(" ") + 1,
                                  )}
                            </div>
                          ))
                          .slice(0, 2)
                      ) : (
                          <span className="text-secondary small">Not set</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-column ">
                      <div className="fw-medium text-dark">
                        ₹ {order.price_details.total_paid}
                      </div>
                      <div>
                        <span
                          className={`badge border fw-normal ${
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
                                    ? parseFloat(order.price_details?.cash_collected) > 0
                                      ? "Split Pay"
                                      : "Online"
                                    : order.payment_status}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="status-column">
                    {/* Status Dropdown */}
                    <div className="dropdown">
                      <button
                        className={`btn btn-sm dropdown-toggle w-100 text-start d-flex justify-content-between align-items-center ${
                          order.status === "PENDING"
                            ? "btn-warning"
                            : order.status === "CANCELLED"
                              ? "btn-danger-subtle text-danger border-danger-subtle"
                              : "btn-light border"
                        }`}
                        type="button"
                        data-bs-toggle="dropdown"
                        style={{
                          minWidth: "110px",
                          maxWidth: "180px",
                          fontSize: "0.8rem",
                        }}
                        data-bs-popper-config='{"strategy":"fixed"}'
                        disabled={
                          order.status === "CANCELLED" ||
                          order.status === "DELIVERED"
                        }
                      >
                        {order.status}
                      </button>
                      {/* Cancellation Reason Display */}
                      {order.status === "CANCELLED" &&
                        order.cancellation_reason && (
                          <div
                            className="text-danger small mt-1 text-truncate"
                            style={{ fontSize: "0.75em", maxWidth: "110px" }}
                            title={order.cancellation_reason}
                          >
                            {order.cancellation_reason}
                          </div>
                        )}
                      <ul className="dropdown-menu shadow-sm border-0">
                        {(ALLOWED_TRANSITIONS[order.status] || []).map((s) => (
                          <li key={s}>
                            <button
                              className="dropdown-item small"
                              onClick={() => {
                                if (s === "CANCELLED" && onCancelClick) {
                                  onCancelClick(order);
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
                    {/* Driver Info Badge (StoreOrders style) */}
                    {order.assigned_driver && (
                      <div
                        className="mt-2 p-1 bg-light border rounded small d-flex align-items-center gap-2"
                        style={{ lineHeight: 1 }}
                      >
                        <div
                          className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 pb-0 ${order.status === "OUT_FOR_DELIVERY" ? "bg-success text-white" : "bg-secondary text-white"}`}
                          style={{
                            width: "24px",
                            height: "24px",
                            fontSize: "0.7rem",
                          }}
                        >
                          <i
                            className={`bi bi-${order.assigned_driver.vehicle === "Bike" ? "bicycle" : "scooter"}`}
                          />
                        </div>
                        <div
                          className="text-truncate"
                          style={{ maxWidth: "90px" }}
                        >
                          <span
                            className="fw-medium d-block text-dark small"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {order.assigned_driver.name}
                          </span>
                        </div>
                      </div>
                    )}
                    {showAssignAction &&
                      order.status === "PACKED" &&
                      !order.assigned_driver &&
                      onAssignDriver && (
                        <div className="mt-2">
                          <button
                            className="btn btn-primary btn-sm border fw-medium shadow-sm w-100 d-flex align-items-center justify-content-center"
                            onClick={(e) => {
                              onAssignDriver(order);
                            }}
                            title="Assign Delivery Partner"
                            style={{ fontSize: "0.8rem", maxWidth: "180px" }}
                          >
                            <i className="bi bi-person-plus-fill me-1" />
                            <span className="d-inline">Assign</span>
                          </button>
                        </div>
                      )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
