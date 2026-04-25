import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

const RelatedProductsSkeleton = () => {
  return (
    <SkeletonTheme>
      <div className="row mt-2">
        <div className="tab-content">
          <div className="tab-pane fade show active">
            <div className="row">
              {Array(6)
                .fill(0)
                .map((_, index) => (
                  <div className="col-6 col-md-4 col-lg-2 mb-4" key={index}>
                    <div className="w-100 h-100 p-2">
                      <div
                        className="mb-3 w-100"
                        style={{
                          height: "100px",
                          backgroundColor: "#f0f0f0", // Fallback color
                          borderRadius: "8px",
                          overflow: "hidden",
                        }}
                      >
                        <Skeleton
                          height="100%"
                          width="100%"
                          containerClassName="d-block h-100"
                          style={{ display: "block", height: "100%" }}
                        />
                      </div>

                      {/* ==== TEXT DETAILS ==== */}
                      <div>
                        {/* Title */}
                        <Skeleton
                          height={20}
                          width="80%"
                          className="mb-2"
                          containerClassName="d-block"
                        />

                        {/* Subtitle */}
                        <Skeleton
                          height={14}
                          width="50%"
                          className="mb-3"
                          containerClassName="d-block"
                        />

                        {/* Price Row */}
                        <div className="d-flex gap-2">
                          <Skeleton width={50} height={18} />
                          <Skeleton width={40} height={18} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
};

export default RelatedProductsSkeleton;
