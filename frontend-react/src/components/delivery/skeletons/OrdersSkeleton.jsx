import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const OrdersSkeleton = () => (
  <div className="delivery-orders-wrapper">
    <div className="orders-header-row mb-4">
      <Skeleton width={180} height={30} />
      <Skeleton width={100} height={35} borderRadius={20} />
    </div>

    <div className="orders-timeline">
      {[1, 2].map((batchIdx) => (
        <div key={batchIdx} className="batch-card mb-4">
          <div className="batch-header-box">
            <div>
              <Skeleton width={60} height={12} className="mb-1" />
              <Skeleton width={120} height={24} />
            </div>
            <div className="batch-earning-group text-end">
              <Skeleton width={120} height={12} className="mb-1" />
              <Skeleton width={100} height={20} />
            </div>
          </div>

          <div className="orders-timeline-container">
            {[1, 2].map((orderIdx) => (
              <div key={orderIdx} className="delivery-card modern-order-card">
                <div className="modern-order-header">
                  <Skeleton width={100} height={24} borderRadius={4} />
                  <Skeleton width={120} height={24} borderRadius={12} />
                </div>

                <div className="modern-order-body">
                  <div style={{ marginBottom: "1rem" }}>
                    <Skeleton width={150} height={20} className="mb-2" />
                    <div className="address-row-muted">
                      <Skeleton circle width={14} height={14} />
                      <Skeleton width={200} height={14} className="ms-2" />
                    </div>
                    <div className="phone-row-primary">
                      <Skeleton circle width={14} height={14} />
                      <Skeleton width={120} height={14} className="ms-2" />
                    </div>
                  </div>

                  <div className="order-detail-grid-box">
                    <div>
                      <Skeleton width={60} height={12} className="mb-1" />
                      <Skeleton width={100} height={18} />
                    </div>
                    <div>
                      <Skeleton width={60} height={12} className="mb-1" />
                      <Skeleton width={100} height={18} />
                    </div>
                  </div>
                </div>

                <div className="modern-order-footer">
                  <Skeleton width={120} height={18} />
                  <Skeleton width={100} height={35} borderRadius={8} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default OrdersSkeleton;
