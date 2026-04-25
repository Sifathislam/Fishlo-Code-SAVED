import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const DashboardSkeleton = () => (
  <div className="delivery-dashboard-wrapper">
    <div className="earnings-summary-group">
      <div className="delivery-card solid-red-card">
        <div className="earnings-header">
          <Skeleton width={120} height={20} baseColor="#ff8a8a" highlightColor="#ffb3b3" />
          <Skeleton circle width={30} height={30} baseColor="#ff8a8a" highlightColor="#ffb3b3" />
        </div>
        <Skeleton width={180} height={40} className="my-2" baseColor="#ff8a8a" highlightColor="#ffb3b3" />
        <div className="earnings-footer">
          <Skeleton width={150} height={15} baseColor="#ff8a8a" highlightColor="#ffb3b3" />
        </div>
      </div>

      <div className="earnings-history-row">
        <div className="history-stat">
          <Skeleton width={60} height={15} className="mb-1" />
          <Skeleton width={80} height={20} />
        </div>
        <div className="history-divider"></div>
        <div className="history-stat">
          <Skeleton width={80} height={15} className="mb-1" />
          <Skeleton width={90} height={20} />
        </div>
      </div>
    </div>

    <div className="delivery-stats-grid">
      {[1, 2].map((i) => (
        <div key={i} className="delivery-card stat-card-light">
          <div className="stat-header">
            <Skeleton width={40} height={40} borderRadius={8} />
            <Skeleton width={40} height={30} />
          </div>
          <Skeleton width={80} height={15} className="mt-2" />
        </div>
      ))}
    </div>

    <div className="delivery-requests-section">
      <div className="section-header-compact">
        <Skeleton width={150} height={24} />
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="delivery-card request-card">
          <div className="request-header dash-request-header">
            <Skeleton width={100} height={15} />
            <div className="batch-earning-group text-end">
              <Skeleton width={120} height={20} />
              <Skeleton width={80} height={15} />
            </div>
          </div>
          <div className="request-body">
            <div className="detail-content-padding">
              <div className="route-point">
                <Skeleton circle width={20} height={20} />
                <div className="route-details w-100 ms-2">
                  <Skeleton width={80} height={12} />
                  <Skeleton width={120} height={18} />
                </div>
              </div>
            </div>
            <div className="dash-route-section">
              <Skeleton width={140} height={16} className="mb-2" />
              {[1, 2].map((j) => (
                <div key={j} className="dash-dest-item">
                  <div className="w-100">
                    <Skeleton width={60} height={14} />
                    <Skeleton width={200} height={12} />
                  </div>
                  <Skeleton width={50} height={18} />
                </div>
              ))}
            </div>
          </div>
          <div className="request-footer gap-2 px-3 pb-3">
            <Skeleton width="100%" height={40} borderRadius={8} />
            <Skeleton width="100%" height={40} borderRadius={8} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default DashboardSkeleton;
