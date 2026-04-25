import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";


const FeaturedProductCardSkeleton = ({ cards = 6 }) => {
  return (
    <SkeletonTheme baseColor="#e0e0e0" highlightColor="#f5f5f5">
      {Array(cards)
        .fill(0)
        .map((_, index) => (
          <div 
            className="sp-product-box" 
            key={index}
            // 1. Min-Width prevents horizontal collapse on mobile
            style={{ minWidth: "165px" }} 
          >
            <div className="sp-product-card">
              <div className="sp-pro-box">
                
                {/* ==== IMAGE AREA ==== */}
                <div className="sp-pro-img" style={{ borderBottom: "none", marginBottom: "12px" }}>
                  
                  {/* 2. CRITICAL FIX: Wrap in a DIV with explicit height. 
                      This forces the skeleton to show up on mobile. */}
                  <div style={{ height: "150px", width: "100%", display: "block" }}>
                    <Skeleton 
                      height="100%" 
                      width="100%" 
                      style={{ borderRadius: "8px", display: "block" }} 
                    />
                  </div>
                  
                </div>

                {/* ==== DETAILS AREA ==== */}
                <div className="sp-pro-details">
                  
                  {/* Line 1: Title */}
                  <div style={{ display: "block", marginBottom: "8px" }}>
                    <Skeleton height={20} width="85%" />
                  </div>

                  {/* Line 2: Meta */}
                  <div style={{ display: "block", marginBottom: "10px" }}>
                    <Skeleton height={14} width="65%" />
                  </div>

                  {/* Line 3: Price */}
                  <div style={{ display: "block", marginBottom: "8px" }}>
                    <Skeleton height={22} width="50%" />
                  </div>

                  {/* Line 4: Delivery */}
                  <div style={{ display: "block" }}>
                    <Skeleton height={12} width="60%" />
                  </div>

                </div>
              </div>
            </div>
          </div>
        ))}
    </SkeletonTheme>
  );
};

export default FeaturedProductCardSkeleton;
