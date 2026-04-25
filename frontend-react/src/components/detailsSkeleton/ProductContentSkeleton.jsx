import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

export default function ProductContentSkeleton() {
  return (
    <SkeletonTheme>
      <div className="single-pro-block">
        <div className="single-pro-inner">
          <div className="row">
            {/* Image Column */}
            <div className="col-lg-6 col-md-6 col-12 mb-4 mb-md-0">
              <div
                style={{
                  position: "relative",
                  paddingBottom: "75%",
                  width: "100%",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <Skeleton
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    width: "100%",
                  }}
                />
              </div>
            </div>

            {/* Content Column */}
            <div className="col-lg-6 col-md-6 col-12 single-pro-desc mt-4 mt-md-0">
              <div className="single-pro-content" style={{ display: "block" }}>
                {/* Title */}
                <h5 className="sp-single-title mb-2">
                  <Skeleton height={30} width="80%" />
                </h5>

                {/* Short Description */}
                <div className="product_short_desc mb-3">
                  <Skeleton count={2} />
                  <Skeleton width="60%" />
                </div>

                {/* Price and Stock */}
                <div className="sp-single-price-stoke mb-4 d-flex align-items-center justify-content-between">
                  <div className="sp-single-price">
                    <Skeleton width={120} height={30} />
                  </div>
                  <div className="sp-single-stoke">
                    <Skeleton width={100} height={20} />
                  </div>
                </div>

                {/* Offer Banner */}
                <div className="my-3 w-100">
                  <div className="rounded" style={{ border: "none" }}>
                    <Skeleton height={50} borderRadius={8} />
                  </div>
                </div>

                {/* ---Cuts (Variants) Horizontal Row --- */}
                <div className="">
                  <div
                    className="d-flex"
                    style={{
                      gap: "10px",
                      overflowX: "auto",
                      whiteSpace: "nowrap",
                      paddingBottom: "5px",
                      scrollbarWidth: "none",
                    }}
                  >
                    {Array(3)
                      .fill(0)
                      .map((_, index) => (
                        <div
                          key={index}
                          className="cut-item"
                          style={{
                            border: "1px solid #eee",
                            borderRadius: "8px",
                            width: "80px",
                            flex: "0 0 auto",
                            display: "flex",
                            flexDirection: "column",
                            padding: "8px",
                            backgroundColor: "#fff",
                          }}
                        >
                          {/* Image Area */}
                          <div
                            className="cut-image-box"
                            style={{
                              height: "40px",
                              width: "100%",
                              marginBottom: "8px",
                              overflow: "hidden",
                              borderRadius: "4px",
                            }}
                          >
                            <Skeleton
                              height="100%"
                              width="100%"
                              style={{ display: "block", lineHeight: 1 }}
                            />
                          </div>

                          {/* Name Area */}
                          <div className="cut-name w-100 d-flex justify-content-center">
                            <Skeleton width={50} height={12} />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                {/* --- FIX END --- */}

                {/* Add to Cart / Quantity */}
                <div className="sp-single-cart mt-2">
                  <Skeleton height={45} width={160} borderRadius={4} />
                </div>

                {/* Delivery Info */}
                <div className="delivery-info-main mt-3">
                  <div className="d-flex align-items-center gap-2">
                    <Skeleton circle width={20} height={20} />
                    <Skeleton width={150} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}
