import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

export default function BargainChatboxSkeleton() {
  return (
    <SkeletonTheme>
      <div className="p-0 h-100">
        <div
          className="card shadow-sm border-0 h-100"
          style={{ minHeight: "400px" }}
        >
          {/* --- Header Skeleton --- */}
          <div className="card-header py-3 rounded-top bg-light">
            <div className="d-flex align-items-center">
              {/* Icon Circle */}
              <div className="me-2 flex-shrink-0">
                <Skeleton circle width={24} height={24} />
              </div>

              <div className="w-100">
                {/* Title Line */}
                <div className="mb-1" style={{ lineHeight: 1 }}>
                  <Skeleton width="40%" height={14} />
                </div>
                {/* Subtitle Line */}
                <div style={{ lineHeight: 1 }}>
                  <Skeleton width="60%" height={10} />
                </div>
              </div>
            </div>
          </div>

          {/* --- Body (Messages) Skeleton --- */}
          <div
            className="card-body p-3 d-flex flex-column"
            style={{ height: "400px" }}
          >
            {/* Scrollable Area */}
            <div className="flex-grow-1 overflow-hidden mb-3">
              {/* 1. Mock AI Message (Left) */}
              <div className="d-flex mb-3 justify-content-start">
                <div className="me-2 flex-shrink-0">
                  <Skeleton circle width={30} height={30} />
                </div>
                {/* Message Bubble - using standard inline-block to handle width */}
                <div style={{ width: "70%" }}>
                  <Skeleton height={55} borderRadius={8} />
                </div>
              </div>

              {/*  Mock User Message (Right) */}
              <div className="d-flex mb-3 justify-content-end">
                <div style={{ width: "50%" }}>
                  <Skeleton height={40} borderRadius={8} />
                </div>
                <div className="ms-2 flex-shrink-0">
                  <Skeleton circle width={30} height={30} />
                </div>
              </div>

              {/*  Mock AI Reply (Left - Short) */}
              <div className="d-flex mb-2 justify-content-start">
                <div className="me-2 flex-shrink-0">
                  <Skeleton circle width={30} height={30} />
                </div>
                <div style={{ width: "40%" }}>
                  <Skeleton height={35} borderRadius={8} />
                </div>
              </div>
            </div>

            {/* --- Input Area Skeleton --- */}
            <div className="d-flex align-items-center w-100">
              {/* Input Field Placeholder */}
              <div className="flex-grow-1">
                {/* We pass a custom style to get the rounded-left effect */}
                <Skeleton
                  height={45}
                  style={{ borderRadius: "25px 0 0 25px" }}
                />
              </div>

              {/* Send Button Placeholder */}
              <div style={{ width: "56px", borderLeft: "2px solid #fff" }}>
                {/* We pass a custom style to get the rounded-right effect */}
                <Skeleton
                  height={45}
                  style={{ borderRadius: "0 25px 25px 0" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}
