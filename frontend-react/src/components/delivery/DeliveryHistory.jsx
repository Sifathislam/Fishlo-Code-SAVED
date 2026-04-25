import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeliveryHistory } from "../../features/useDeliveryAssignment";
import "../../styles/delivery.css";

const DeliveryHistory = () => {
  const [days, setDays] = useState(30);
  const { data: historyResponse, isLoading, isError } = useDeliveryHistory(days);
  const navigate = useNavigate();

  const historyBatches = historyResponse?.data || [];

  // Calculate totals for the selected period
  const totalEarned = historyBatches.reduce((sum, batch) => sum + parseFloat(batch.total_earnings || 0), 0);
  const totalDeliveries = historyBatches.reduce((sum, batch) => sum + (batch.total_orders || 0), 0);

  // Group by date
  const groupedBatches = {};
  historyBatches.forEach(batch => {
    let dateStr = "Unknown Date";
    if (batch.delivery_date) {
      dateStr = new Date(batch.delivery_date).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    }
    if (!groupedBatches[dateStr]) groupedBatches[dateStr] = [];
    groupedBatches[dateStr].push(batch);
  });

  if (isLoading) {
    return (
      <div className="delivery-loader-overlay">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="delivery-container-tight">
      <div className="profile-header-card" style={{ marginBottom: "16px", padding: '16px' }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1e293b", margin: 0, marginBottom: "16px" }}>
          Delivery History
        </h2>
        
        <div className="history-filter-pills" style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { label: "Today", value: 1 },
            { label: "Last 7 Days", value: 7 },
            { label: "Last 30 Days", value: 30 }
          ].map(filter => (
            <button
              key={filter.value}
              className={`pill-btn ${days === filter.value ? 'active' : ''}`}
              onClick={() => setDays(filter.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                background: days === filter.value ? '#14b8a6' : '#fff',
                color: days === filter.value ? '#fff' : '#64748b',
                fontSize: '0.85rem',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Summary Stats Container */}
        <div style={{ display: 'flex', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Total Deliveries</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>{totalDeliveries}</span>
          </div>
          <div style={{ width: '1px', background: '#e2e8f0' }}></div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Total Earned</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>₹{totalEarned.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="history-list-container">
        {Object.keys(groupedBatches).length === 0 ? (
          <div className="empty-state-card text-center" style={{ padding: '32px 16px', color: '#64748b' }}>
            <i className="fa fa-history" style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.5 }}></i>
            <p>No delivery history found for this period.</p>
          </div>
        ) : (
          Object.keys(groupedBatches).map(dateGroup => (
            <div key={dateGroup} className="history-date-group" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600', marginBottom: '10px', paddingLeft: '4px', textTransform: 'uppercase' }}>
                {dateGroup}
              </h3>
              
              {groupedBatches[dateGroup].map(batch => (
                <div key={batch.id} className="detail-card-white" style={{ marginBottom: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>BATCH #{batch.batch_number}</span>
                      <span style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>{batch.slot_label}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <span style={{ 
                         fontSize: '0.7rem', 
                         fontWeight: '600', 
                         padding: '4px 8px', 
                         borderRadius: '12px',
                         background: batch.status === 'completed' ? '#dcfce7' : '#f1f5f9',
                         color: batch.status === 'completed' ? '#166534' : '#475569',
                         textTransform: 'uppercase'
                       }}>
                         {batch.status}
                       </span>
                    </div>
                  </div>

                  <div className="dashed-border" style={{ margin: '12px 0' }}></div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: '#475569' }}>
                      <i className="fa fa-shopping-bag" style={{ marginRight: '6px' }}></i>
                      {batch.total_orders} Orders
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#10b981' }}>
                      +₹{batch.total_earnings}
                    </span>
                  </div>

                  {batch.orders && batch.orders.length > 0 && (
                    <div style={{ marginTop: '12px', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                       {batch.orders.map(item => (
                         <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
                           <span style={{ color: '#475569' }}>{item.order?.order_number}</span>
                           <span style={{ color: '#10b981', fontWeight: '600' }}>₹{item.order?.delivery_charge}</span>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DeliveryHistory;
