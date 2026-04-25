import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

export default function RightSideSkeleton() {
  return (
    <SkeletonTheme>
      <div className="nb-card" style={{ height: "400px", padding: "20px" }}>
        {/* Header Area */}
        <div style={{ marginBottom: "20px" }}>
          <div className="d-flex align-items-center mb-2">
            <Skeleton circle width={24} height={24} className="me-2" />
            <Skeleton width="40%" height={20} />
          </div>
          <Skeleton width="70%" height={30} />
          <Skeleton width="100%" height={15} style={{ marginTop: "10px" }} />
          <Skeleton width="90%" height={15} />
        </div>

        {/* List items Area */}
        <div style={{ marginTop: "30px" }}>
          <div className="d-flex align-items-center mb-3">
            <Skeleton circle width={36} height={36} className="me-3" />
            <div className="flex-grow-1">
              <Skeleton width="50%" height={18} />
              <Skeleton width="80%" height={12} style={{ marginTop: "5px" }} />
            </div>
          </div>
          
          <div className="d-flex align-items-center mb-3">
            <Skeleton circle width={36} height={36} className="me-3" />
            <div className="flex-grow-1">
              <Skeleton width="45%" height={18} />
              <Skeleton width="75%" height={12} style={{ marginTop: "5px" }} />
            </div>
          </div>
        </div>

        {/* Divider and Footer */}
        <div style={{ marginTop: "30px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
          <Skeleton width="100%" height={40} borderRadius={8} />
        </div>
      </div>
    </SkeletonTheme>
  );
}
