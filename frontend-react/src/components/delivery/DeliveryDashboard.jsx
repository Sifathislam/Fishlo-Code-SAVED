import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  useMyAssignments, 
  useAcceptAssignment, 
  useRejectAssignment,
  usePartnerStatus,
  useUpdatePartnerStatus,
  useDashboardStats,
} from "../../features/useDeliveryAssignment";
import DashboardSkeleton from "./skeletons/DashboardSkeleton";

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  
  const { data: assignmentsResponse, isLoading: isLoadingAssignments, error: assignmentsError, refetch: refetchAssignments } = useMyAssignments({ pending: "true" });
  const { data: statsResponse, isLoading: isLoadingStats, error: statsError, refetch: refetchStats } = useDashboardStats();
  
  const acceptMutation = useAcceptAssignment();
  const rejectMutation = useRejectAssignment();

  const assignments = assignmentsResponse?.data || [];
  const stats = statsResponse?.data || {
    today_earnings: "0.00",
    yesterday_earnings: "0.00",
    last_7_days_earnings: "0.00",
    completed_today: 0,
    pending_orders: 0
  };

  // The backend now returns an array of batches directly.
  // Only show pending batches as "New Assignments" — accepted ones go to Delivery Orders
  const requests = assignments.filter(batch => batch.status === "pending").map(batch => {
    const mappedOrders = (batch.orders || []).map(orderItem => {
      const ord = orderItem.order;
      const earningPrice = parseFloat(ord.delivery_charge) || 0;
      return {
        id: ord.order_number,
        loc: `${ord.address?.house_details || ''}, ${ord.address?.city || ''}`,
        price: earningPrice.toFixed(2),
        assignment_id: batch.id
      };
    });

    return {
      id: batch.id,
      time: new Date(batch.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      total: (parseFloat(batch.total_earnings) || 0).toFixed(2),
      pickup: "Fishlo Store", // Static for now
      orders: mappedOrders
    };
  });

  const [actionError, setActionError] = React.useState({ id: null, message: "" });

  const handleAccept = async (assignmentId) => {
    setActionError({ id: null, message: "" });
    try {
      await acceptMutation.mutateAsync(assignmentId);
      // Success is handled by cache invalidation in the hook
    } catch (err) {
      console.error("Failed to accept assignment:", err);
      const errorMsg = err.response?.data?.message || "Failed to accept batch. Please try again.";
      setActionError({ 
        id: assignmentId, 
        message: errorMsg
      });
    }
  };

  const handleReject = async (assignmentId) => {
    setActionError({ id: null, message: "" });
    if (!window.confirm("Are you sure you want to decline this batch?")) return;
    try {
      await rejectMutation.mutateAsync(assignmentId);
    } catch (err) {
      console.error("Failed to reject assignment:", err);
      const errorMsg = err.response?.data?.message || "Failed to decline batch. Please try again.";
      setActionError({ 
        id: assignmentId, 
        message: errorMsg
      });
    }
  };

  if (isLoadingAssignments || isLoadingStats) {
    return <DashboardSkeleton />;
  }

  if (assignmentsError || statsError) {
    return (
      <div className="delivery-dashboard-wrapper">
        <div className="alert alert-danger m-3" role="alert">
          <h4 className="alert-heading">Error!</h4>
          <p>Failed to load dashboard data. Please check your connection and try again.</p>
          <hr />
          <button className="btn btn-outline-danger btn-sm" onClick={() => { refetchAssignments(); refetchStats(); }}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="delivery-dashboard-wrapper">
      {/* Earnings Summary */}
      <div className="earnings-summary-group">
        <div className="delivery-card solid-red-card">
          <div className="earnings-header">
            <h3 className="card-subtitle-small">Today's Earnings</h3>
            <button className="icon-btn-light-solid"><i className="fa fa-chevron-right"></i></button>
          </div>
          <p className="card-value-large">₹ {stats.today_earnings}</p>
          <div className="earnings-footer">
            <span><i className="fa fa-line-chart"></i> Updated just now</span>
          </div>
        </div>

        <div className="earnings-history-row">
          <div className="history-stat">
            <span className="history-label">Yesterday</span>
            <span className="history-value">₹ {stats.yesterday_earnings}</span>
          </div>
          <div className="history-divider"></div>
          <div className="history-stat">
            <span className="history-label">Last 7 Days</span>
            <span className="history-value">₹ {stats.last_7_days_earnings}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="delivery-stats-grid">
        <div className="delivery-card stat-card-light">
          <div className="stat-header">
            <div className="stat-icon-square bg-success-lightest">
              <i className="fa fa-check-circle text-success"></i>
            </div>
            <p className="stat-value text-success">{stats.completed_today}</p>
          </div>
          <h3 className="stat-title">Completed</h3>
        </div>

        <div className="delivery-card stat-card-light">
          <div className="stat-header">
            <div className="stat-icon-square bg-warning-lightest">
              <i className="fa fa-circle text-warning"></i>
            </div>
            <p className="stat-value text-warning">{stats.pending_orders}</p>
          </div>
          <h3 className="stat-title">Pending</h3>
        </div>
      </div>

      {/* Incoming Delivery Requests Feed */}
      <div className="delivery-requests-section">
        <div className="section-header-compact">
          <h3 className="section-title">New Assignments ({requests.length})</h3>
        </div>

        {requests.length === 0 ? (
          <div className="delivery-card p-4 text-center">
            <i className="fa fa-info-circle fa-2x text-muted mb-2"></i>
            <p className="text-muted">No new assignments at the moment. Keep the app open to receive new batches.</p>
          </div>
        ) : (
          requests.map(request => (
            <div key={request.id} className="delivery-card request-card">
              <div className="request-header dash-request-header">
                <span className="request-time">Assigned {request.time}</span>
                <div className="batch-earning-group">
                  <span className="dash-earning-large">Total: ₹ {request.total}</span>
                  <span className="dash-order-count">{request.orders.length} Order(s)</span>
                </div>
              </div>

              <div className="request-body">
                <div className="detail-content-padding">
                  <div className="route-point">
                    <i className="fa fa-map-marker text-primary"></i>
                    <div className="route-details">
                      <span className="route-label">Pickup Location</span>
                      <span className="route-address">{request.pickup}</span>
                    </div>
                  </div>
                </div>

                <div className="dash-route-section">
                  <span className="dash-dest-label">Delivery Destinations</span>
                  <div className="dash-dest-list">
                    {request.orders.slice(0, 3).map((ord, idx) => (
                      <div key={idx} className="dash-dest-item">
                        <div>
                          <p className="dash-dest-id">#{ord.id}</p>
                          <p className="dash-dest-loc">{ord.loc}</p>
                        </div>
                        <span className="dash-dest-price">₹ {ord.price}</span>
                      </div>
                    ))}
                    {request.orders.length > 3 && (
                      <p className="dash-more-orders">
                        + {request.orders.length - 3} more orders...
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="request-footer" style={{ flexDirection: "column" }}>
                {actionError.id === request.id && (
                  <div className="text-danger w-100 mb-2 small px-1" style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                    <i className="fa fa-exclamation-circle me-1"></i> {actionError.message}
                  </div>
                )}
                <div className="d-flex w-100 gap-2">
                  <button 
                    disabled={rejectMutation.isPending}
                    onClick={() => handleReject(request.id)}
                    className="delivery-btn btn-outline-primary btn-small flex-fill"
                  >
                    {rejectMutation.isPending && request.id === rejectMutation.variables ? 'Declining...' : 'Decline'}
                  </button>
                  <button 
                    disabled={acceptMutation.isPending}
                    onClick={() => handleAccept(request.id)} 
                    className="delivery-btn btn-accept btn-small flex-fill"
                  >
                    {acceptMutation.isPending && request.id === acceptMutation.variables ? 'Accepting...' : 'Accept Batch'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard;
