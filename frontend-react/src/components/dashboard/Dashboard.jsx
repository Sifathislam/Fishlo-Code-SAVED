import { Package, ShoppingCart, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetDashboardSummary } from "../../features/useGetDashboard";
import Loader from "../../shared/components/Loader";
import { formatDate } from "../../shared/utils/dateUtils";

export default function Dashboard() {
  const { data, isPending, isError } = useGetDashboardSummary();
  const navigate = useNavigate();

  if (isPending)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px", width: "100%" }}
      >
        <Loader />
      </div>
    );
  if (isError) return <div className="p-4 text-danger">Error loading data</div>;

  // Destructure data from your API response structure
  const { summary, recent_activity } = data;

  const handleGoToOrders = (order) => {
    navigate("/dashboard/orders", {
      state: { orderNumber: order?.order_number },
    });
  };

  return (
    <div className="fade-in">
      <title>My Dashboard | Fishlo</title>
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card-custom d-flex flex-row align-items-center mb-0">
            <div className="stat-icon bg-soft-red me-3">
              <ShoppingCart size={20} className="text-danger" />
            </div>
            <div>
              <h5 className="text-muted fw-normal fs-6 mb-1">Total Orders</h5>
              <h2 className="fw-medium mb-0">{summary.total_orders}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card-custom d-flex flex-row align-items-center mb-0">
            <div
              className="stat-icon me-3"
              style={{ backgroundColor: "#e0f2fe", color: "#0284c7" }}
            >
              <Package size={20} />
            </div>
            <div>
              <h5 className="text-muted fw-normal fs-6 mb-1">Pending</h5>
              <h2 className="fw-medium mb-0">{summary.pending_orders}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card-custom d-flex flex-row align-items-center mb-0">
            <div
              className="stat-icon me-3"
              style={{ backgroundColor: "#Fee2e2", color: "#EF4444" }}
            >
              <XCircle size={20} />
            </div>
            <div>
              <h5 className="text-muted fw-normal fs-6 mb-1">Cancelled</h5>
              <h2 className="fw-medium mb-0">{summary.cancelled_orders}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="card-custom p-0 overflow-hidden">
        <div className="p-4 d-flex justify-content-between align-items-center border-bottom border-light">
          <h5 className="fw-medium mb-0">Recent Activity</h5>
          <button
            className="btn btn-sm btn-outline-secondary rounded-pill px-3"
            onClick={() => navigate("/dashboard/orders/")}
          >
            View All
          </button>
        </div>
        <div className="table-responsive">
          <table
            className="table-custom mb-0"
            style={{ marginTop: 0, borderSpacing: 0 }}
          >
            <thead className="bg-light">
              <tr>
                <th className="ps-4 py-3">Order</th>
                <th className="py-3">Date</th>
                <th className="py-3">Status</th>
                <th className="text-end pe-4 py-3">Total</th>
              </tr>
            </thead>

            <tbody>
              {recent_activity?.length > 0 ? (
                recent_activity?.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => handleGoToOrders(order)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="ps-4 fw-medium text-dark">
                      <div className="d-flex align-items-center">
                        <div className="bg-light rounded p-1 me-3">
                          <Package size={16} className="text-muted" />
                        </div>
                        #{order.order_number}
                        {/* #{order.order_number.split("-").pop()} */}
                      </div>
                    </td>
                    <td className="text-muted">{formatDate(order.date)}</td>
                    <td>
                      <span
                        className={`badge badge-soft ${order.status_display === "Pending"
                          ? "badge-processing"
                          : "badge-success"
                          }`}
                      >
                        {order.status_display}
                      </span>
                    </td>
                    <td className="text-end pe-4 fw-medium">
                      ₹{order.total_amount}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-5">
                    <div className="text-muted">
                      <Package size={40} className="mb-2 opacity-50" />
                      <p className="mb-0">No recent orders found.</p>
                      <small>
                        When you make a purchase, it will appear here.
                      </small>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
