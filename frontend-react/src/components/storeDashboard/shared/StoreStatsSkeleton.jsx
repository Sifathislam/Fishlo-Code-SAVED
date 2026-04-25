
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function StoreStatsSkeleton() {
  return (
    <SkeletonTheme baseColor="#e2e8f0" highlightColor="#f8fafc">
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-5 g-3 mb-4">
        {/* Generate 5 placeholder cards */}
        {[...Array(5)].map((_, index) => (
          <div className="col" key={index}>
            <div className="sd-brand-card p-3 h-100 align-items-center">
              {/* Icon Circle Skeleton */}
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 pb-0"
                style={{
                  width: "64px",
                  height: "64px",
                  overflow: "hidden",
                }}
              >
                <Skeleton circle width={64} height={64} />
              </div>
              
              {/* Text Content Skeleton */}
              <div className="ms-3 flex-grow-1">
                <div style={{ lineHeight: 1 }}>
                  {/* Large Number */}
                  <Skeleton width={40} height={30} />
                </div>
                <div className="mt-1">
                  {/* Label */}
                  <Skeleton width={70} height={16} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SkeletonTheme>
  );
}
