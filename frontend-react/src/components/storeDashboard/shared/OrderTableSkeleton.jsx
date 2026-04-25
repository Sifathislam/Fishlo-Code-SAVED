
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function OrderTableSkeleton({ rowCount = 5 }) {
  return (
    <div className="table-responsive">
      <SkeletonTheme baseColor="#e2e8f0" highlightColor="#f8fafc">
        <table className="sd-table w-100">
          <thead>
            <tr>
              <th style={{ minWidth: "100px" }}>Order #</th>
              <th style={{ minWidth: "140px" }}>Customer</th>
              <th style={{ minWidth: "250px" }}>Items Summary</th>
              <th style={{ minWidth: "100px" }}>Amount</th>
              <th style={{ minWidth: "130px" }}>Payment</th>
              <th style={{ minWidth: "120px" }}>Status</th>
              <th className="text-end" style={{ minWidth: "100px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(rowCount)].map((_, index) => (
              <tr key={index} className="bg-white border-bottom">
                {/* Order # */}
                <td className="py-3">
                  <Skeleton width={100} height={20} />
                  <div className="mt-1">
                    <Skeleton width={60} height={14} />
                  </div>
                </td>
                
                {/* Customer */}
                <td className="py-3">
                  <div style={{ maxWidth: "140px" }}>
                    <Skeleton width={120} height={18} />
                    <div className="mt-1">
                      <Skeleton width={90} height={14} />
                    </div>
                  </div>
                </td>

                {/* Items Summary */}
                <td className="py-3">
                  <div className="d-flex align-items-center gap-2" style={{ maxWidth: "200px" }}>
                    <Skeleton width={160} height={18} />
                    <Skeleton width={40} height={24} borderRadius={12} />
                  </div>
                </td>

                {/* Amount */}
                <td className="py-3">
                  <Skeleton width={60} height={18} />
                </td>

                {/* Payment */}
                <td className="py-3">
                  <Skeleton width={80} height={24} borderRadius={4} />
                </td>

                {/* Status */}
                <td className="py-3">
                  <Skeleton width={100} height={30} borderRadius={4} />
                </td>

                {/* Action */}
                <td className="text-end py-3">
                  <div className="d-flex justify-content-end gap-2">
                    <Skeleton width={60} height={30} borderRadius={4} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SkeletonTheme>
    </div>
  );
}
