import React from 'react';
import Skeleton from 'react-loading-skeleton';

export default function CollectionSkeletonCard() {
  return (
    <div
      className="sp-collection-block skeleton-mode"
      aria-hidden="true"
      style={{ cursor: "default" }}
    >
      <div className="collection-detail">
        {/* Image Area */}
        <div className="collection-img-skeleton">
            {/* You might need to adjust the height style above to match your CSS aspect ratio */}
            <Skeleton height="100%" width="100%" />
        </div>

        <div className="collection-info">
          {/* Title */}
          <h5 className="collection-product-name">
            <Skeleton count={1} width="85%" />
            <Skeleton count={1} width="60%" />
          </h5>

          {/* Middle Section (Price/Rating placeholder) */}
          <div className="d-flex align-items-center justify-content-between mt-3 mb-2">
            <div style={{ width: '70%' }}>
                <Skeleton height={24} />
            </div>
          </div>
          
          <Skeleton width="85%" />

          {/* Delivery Info */}
          <div className="delivery-info mt-3 d-flex align-items-center">
            {/* Icon placeholder */}
            <Skeleton circle width={20} height={20} />
            
            {/* Text placeholder */}
            <div className="ms-2" style={{ width: '50%' }}>
                <Skeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
