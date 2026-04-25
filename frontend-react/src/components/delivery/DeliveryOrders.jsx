import { useNavigate } from "react-router-dom";
import { useMyAssignments } from "../../features/useDeliveryAssignment";
import OrdersSkeleton from "./skeletons/OrdersSkeleton";

const DeliveryOrders = () => {
  const navigate = useNavigate();
  const {
    data: assignmentsResponse,
    isLoading,
    error,
    refetch,
  } = useMyAssignments();

  const assignments = assignmentsResponse?.data || [];

  // Filter for active (accepted, in_progress) assignments - status is on the BATCH level
  const activeBatches = assignments.filter((a) =>
    ["accepted", "in_progress"].includes(a.status),
  );

  // Map backend batch format to frontend component structure
  const activeOrders = activeBatches.map((batch) => {
    const mappedOrders = (batch.orders || []).map(orderItem => {
      const ord = orderItem.order;
      return {
        id: ord.order_number,
        status: ord.status ? ord.status.toUpperCase().replace(/ /g, "_") : "PENDING",
        delivery_slot_label: ord.delivery_slot_label || "No slot",
        earning: ord.delivery_charge || "0.00",
        address: ord.address,
        assignment_id: batch.id,
        cash_collected: ord.cash_collected || "0",
        remaining_amount: ord.remaining_amount || "0",
      };
    });

    return {
      batchId: batch.id,
      batchEarning: batch.total_earnings || "0.00",
      orders: mappedOrders
    };
  });

  if (isLoading) {
    return <OrdersSkeleton />;
  }

  if (error) {
    return (
      <div className="delivery-orders-wrapper">
        <div className="alert alert-danger m-3" role="alert">
          <p>Failed to load orders. Please try again.</p>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="delivery-orders-wrapper">
      <div className="orders-header-row">
        <h2 className="orders-page-title">Active Batches</h2>
        <div className="orders-filter-pill bg-primary text-white">
          <span>{activeOrders.length} Batches</span>
        </div>
      </div>

      {activeOrders.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">
            No active batches. Go to Dashboard to accept new ones.
          </p>
          <button
            onClick={() => navigate("/delivery")}
            className="delivery-btn btn-small btn-outline-primary"
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="orders-timeline">
          {activeOrders.map((batch) => (
            <div key={batch.batchId} className="batch-card">
              {/* Batch Header */}
              <div className="batch-header-box">
                <div>
                  <span className="batch-label-small">BATCH</span>
                  <h3 className="batch-id-title">#{batch.batchId}</h3>
                </div>
                <div className="batch-earning-group">
                  <span className="batch-earning-label">ESTIMATED EARNING</span>
                  <span className="batch-earning-value">
                    ₹ {batch.batchEarning}
                  </span>
                </div>
              </div>

              {/* Orders in this Batch - Timeline style */}
              <div className="orders-timeline-container">
                {batch.orders.map((order) => (
                  <div
                    key={order.id}
                    className="delivery-card modern-order-card"
                  >
                    <div className="modern-order-header">
                      <div className="order-id-badge">
                        <span className="hash">#</span>
                        {order.id}
                      </div>
                      <span
                        className={`status-pill ${order.status === "OUT_FOR_DELIVERY" ? "status-pending" : "status-processing"}`}
                      >
                        {order.status === "OUT_FOR_DELIVERY"
                          ? "Next Delivery"
                          : order.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="modern-order-body">
                      <div style={{ marginBottom: "1rem" }}>
                        <p className="customer-name-bold">
                          {order.address?.full_name || "Customer"}
                        </p>
                        <div className="address-row-muted">
                          <i className="fa fa-map-marker"></i>
                          <span>
                            {order.address?.house_details},{" "}
                            {order.address?.city}
                          </span>
                        </div>
                        <div className="phone-row-primary">
                          <i className="fa fa-phone"></i>
                          <span>{order.address?.phone}</span>
                        </div>
                      </div>

                      <div className="order-detail-grid-box">
                        <div>
                          <span className="grid-label-muted">PAYMENT</span>
                          {(() => {
                            const remaining = parseFloat(order.remaining_amount) || 0;
                            const cashCollected = parseFloat(order.cash_collected) || 0;

                            if (cashCollected > 0) {
                              return (
                                <span className="grid-value-semi text-success">
                                  ✅ Collected
                                </span>
                              );
                            }
                            if (remaining > 0) {
                              return (
                                <span className="grid-value-semi text-orange">
                                  Collect ₹{order.remaining_amount}
                                </span>
                              );
                            }
                            return (
                              <span className="grid-value-semi text-success">
                                ✅ Prepaid
                              </span>
                            );
                          })()}
                        </div>
                        <div>
                          <span className="grid-label-muted">TIME SLOT</span>
                          <span className="grid-value-semi">
                            {order.delivery_slot_label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="modern-order-footer">
                      <span className="order-time">
                        <i className="fa fa-money"></i> Earn ₹ {order.earning}
                      </span>
                      <button
                        onClick={() => navigate(`/delivery/orders/${order.id}`)}
                        className="delivery-btn btn-small btn-proceed-active"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryOrders;
