import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const OrderDetailSkeleton = () => (
  <div className="detail-page-wrapper">
    <div className="detail-content-padding">
      <div className="page-title-box">
        <Skeleton circle width={35} height={35} />
        <Skeleton width={150} height={24} className="ms-3" />
      </div>

      {/* Order ID Card Skeleton */}
      <div className="detail-card-white">
        <Skeleton width={60} height={12} className="mb-2" />
        <div className="order-id-row d-flex justify-content-between align-items-center">
          <Skeleton width={120} height={24} />
          <Skeleton width={80} height={24} borderRadius={12} />
        </div>
      </div>

      {/* Customer Detail Card Skeleton */}
      <div className="detail-card-white">
        <div className="customer-detail-header d-flex align-items-center mb-3">
          <Skeleton circle width={50} height={50} />
          <div className="ms-3 w-100">
            <Skeleton width={150} height={20} className="mb-1" />
            <Skeleton width={80} height={15} />
          </div>
        </div>

        <div className="address-box-detail d-flex">
          <Skeleton circle width={20} height={20} className="mt-1" />
          <div className="ms-3 w-100">
            <Skeleton width="80%" height={16} className="mb-1" />
            <Skeleton width="60%" height={14} className="mb-1" />
            <Skeleton width="40%" height={14} />
          </div>
        </div>

        <div className="action-btns-row d-flex gap-2 mt-3">
          <Skeleton width="100%" height={40} borderRadius={8} />
          <Skeleton width="100%" height={40} borderRadius={8} />
        </div>
      </div>

      {/* Payment Summary Skeleton */}
      <div className="detail-card-white">
        <Skeleton width={140} height={20} className="mb-3" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="summary-item-row dashed-border d-flex justify-content-between py-2">
            <Skeleton width={100} height={16} />
            <Skeleton width={80} height={16} />
          </div>
        ))}
      </div>

      {/* OTP Verify Card Skeleton */}
      <div className="otp-verify-card">
        <Skeleton width={120} height={20} className="mx-auto mb-2" />
        <Skeleton width={180} height={14} className="mx-auto mb-4" />
        <div className="otp-inputs-row d-flex justify-content-center gap-2 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width={45} height={55} borderRadius={8} />
          ))}
        </div>
        <Skeleton width="100%" height={50} borderRadius={10} />
      </div>
    </div>
  </div>
);

export default OrderDetailSkeleton;
