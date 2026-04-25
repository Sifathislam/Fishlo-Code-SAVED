import Skeleton from "react-loading-skeleton";


export default function CartSectionSkeleton() {
  return (
    <div
      className="bg-white mx-auto shadow-sm"
      style={{
        maxWidth: "400px",
        borderRadius: "20px",
        padding: "24px",
        border: "1px solid #f0f0f0",
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Skeleton width={150} height={24} borderRadius={4} />
        <Skeleton width={60} height={22} borderRadius={12} />
      </div>

      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="d-flex align-items-center py-3">
            <div style={{ flexShrink: 0 }}>
              <Skeleton width={85} height={60} borderRadius={8} />
            </div>

            <div className="ms-3 flex-grow-1" style={{ minWidth: 0 }}>
              <div className="d-flex justify-content-between align-items-center">
                <div style={{ width: "65%" }}>
                  <Skeleton height={14} />
                </div>

                <div style={{ width: "20%", textAlign: "right" }}>
                  <Skeleton height={14} width={40} />
                </div>
              </div>

              <div className="mt-2" style={{ width: "45%" }}>
                <Skeleton height={10} />
              </div>
            </div>
          </div>

          <div
            style={{ borderBottom: "1px dashed #eee", margin: "0 -4px" }}
          ></div>
        </div>
      ))}

      {/* Coupon Section */}
      <div className="mt-4">
        <Skeleton width={120} height={12} className="mb-2" />
        <Skeleton width="100%" height={45} borderRadius={8} />
      </div>

      {/* Bill Calculation Details */}
      <div className="mt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="d-flex justify-content-between mb-3">
            <Skeleton width={80} height={14} />
            <Skeleton width={50} height={14} />
          </div>
        ))}

        <div style={{ borderBottom: "1px dashed #eee" }} className="my-3"></div>

        {/* Total Amount Row */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Skeleton width={100} height={12} />
          <Skeleton width={110} height={30} borderRadius={4} />
        </div>
      </div>

      {/* Delivery Warning Box (Light Red background with left accent) */}
      <div
        className="p-3 d-flex align-items-center mb-4"
        style={{
          backgroundColor: "#FFF8F8",
          borderRadius: "12px",
          borderLeft: "4px solid #FF4D4D",
        }}
      >
        <Skeleton circle width={18} height={18} className="me-2" />
        <Skeleton width="70%" height={14} />
      </div>

      {/* Primary Action Button */}
      <Skeleton width="100%" height={50} borderRadius={12} />
    </div>
  );
}
