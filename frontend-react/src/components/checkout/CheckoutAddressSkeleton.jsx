import Skeleton from "react-loading-skeleton";

const CheckoutAddressSkeleton = () => {
  return (
    <div className="col-md-6">
      <div className="selection-card h-100" style={{ cursor: "default" }}>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div
            className="d-flex align-items-center gap-2 flex-wrap"
            style={{ width: "70%" }}
          >
            <Skeleton width={120} height={20} />
            <Skeleton width={50} height={18} borderRadius={6} />
          </div>
          <Skeleton circle width={30} height={30} />
        </div>
        <div className="mb-2">
          <Skeleton count={2} height={12} style={{ marginBottom: "6px" }} />
        </div>

        <div className="d-flex align-items-center">
          <Skeleton circle width={15} height={15} className="me-2" />
          <Skeleton width={100} height={12} />
        </div>
      </div>
    </div>
  );
};

export default CheckoutAddressSkeleton;
