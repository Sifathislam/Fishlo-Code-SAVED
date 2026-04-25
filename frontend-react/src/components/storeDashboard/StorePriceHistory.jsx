import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import {
  usePricingHistory,
  usePricingHistoryExport,
} from "../../features/useStorePricing";
import { formatDateTime } from "../../shared/utils/dateUtils";

export default function StorePriceHistory() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = usePricingHistory(searchTerm);
  const exportMutation = usePricingHistoryExport();

  const history = data?.results || [];
  const loading = isLoading;

  const handleExport = () => {
    exportMutation.mutate(undefined, {
      onSuccess: (data) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `price_history_${new Date().toISOString()}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
      },
    });
  };

  return (
    <div className="container-fluid p-0 fade-in">
      {/* Filter Bar */}
      <div className="sd-filter-container mb-4 w-100">
        <div
          className="d-flex align-items-center bg-white border rounded-pill px-3 py-2 shadow-sm sd-search-box flex-grow-1"
          style={{ maxWidth: "400px" }}
        >
          <i className="bi bi-search text-muted me-2"></i>
          <input
            type="text"
            className="border-0 bg-transparent w-100 text-dark"
            style={{ outline: "none", fontSize: "0.95rem" }}
            placeholder="Search product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className="btn btn-light border shadow-sm rounded-pill px-3 text-dark bg-light ms-2"
          onClick={handleExport}
          disabled={exportMutation.isPending}
        >
          <i className="bi bi-download"></i>{" "}
          {exportMutation.isPending ? "Exporting..." : "Export"}
        </button>
      </div>

      <div className="sd-table-card">
        <div className="sd-table-header bg-light">
          <h6 className="mb-0 fw-medium">Recent Changes</h6>
        </div>
        <div className="table-responsive">
          <table className="sd-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Product</th>
                <th>Wholesale</th>
                <th>Regular</th>
                <th>Display</th>
                <th>Bargain</th>
                <th>Min</th>
                <th>User</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td>
                      <Skeleton width={100} />
                    </td>
                    <td>
                      <Skeleton width={120} />
                    </td>
                    <td>
                      <Skeleton width={80} />
                    </td>
                    <td>
                      <Skeleton width={80} />
                    </td>
                    <td>
                      <Skeleton width={80} />
                    </td>
                    <td>
                      <Skeleton width={80} />
                    </td>
                    <td>
                      <Skeleton width={80} />
                    </td>
                    <td>
                      <Skeleton width={80} />
                    </td>
                    <td>
                      <Skeleton width={60} />
                    </td>
                  </tr>
                ))
              ) : history.length > 0 ? (
                history.map((item, index) => (
                  <tr key={item.id || index} className="sd-hover-row">
                    <td
                      className="text-muted small fw-medium"
                      style={{
                        minWidth: "130px",
                        maxWidth: "150px",
                        lineHeight: "1.2",
                      }}
                    >
                      {formatDateTime(item.created_at)}
                    </td>
                    <td
                      className="fw-medium text-dark"
                      style={{ minWidth: "220px", maxWidth: "300px" }}
                    >
                      {item.product_name}
                    </td>


                    <PriceChangeCell
                      oldPrice={item.old_wholesale_price}
                      newPrice={item.new_wholesale_price}
                      action={item.action}
                    />
                    <PriceChangeCell
                      oldPrice={item.old_regular_price}
                      newPrice={item.new_regular_price}
                      action={item.action}
                    />
                    <PriceChangeCell
                      oldPrice={item.old_display_price}
                      newPrice={item.new_display_price}
                      action={item.action}
                    />
                    <PriceChangeCell
                      oldPrice={item.old_bargain_price}
                      newPrice={item.new_bargain_price}
                      action={item.action}
                    />
                    <PriceChangeCell
                      oldPrice={item.old_min_price}
                      newPrice={item.new_min_price}
                      action={item.action}
                    />

                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="bg-light rounded-circle border d-flex align-items-center justify-content-center text-muted"
                          style={{
                            width: "24px",
                            height: "24px",
                            fontSize: "10px",
                          }}
                        >
                          <i className="bi bi-person-fill"></i>
                        </div>
                        <span className="small text-dark fw-medium text-nowrap">
                          {item.user_name || "System"}
                        </span>
                      </div>
                    </td>
                    <td>
                      {item.action === "CREATED" && (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill">
                          Created
                        </span>
                      )}
                      {item.action === "UPDATED" && (
                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill">
                          Updated
                        </span>
                      )}
                      {item.action === "DEACTIVATED" && (
                        <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill">
                          Deactivated
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    No price history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PriceChangeCell({ oldPrice, newPrice, action }) {
  const oldP = parseFloat(oldPrice) || 0;
  const newP = parseFloat(newPrice) || 0;
  const hasChanged = oldP !== newP;

  if (action === "CREATED") {
    return (
      <td>
        <span className="text-dark">₹{newP}</span>
      </td>
    );
  }

  if (hasChanged) {
    return (
      <td>
        <div
          className="d-flex align-items-center flex-wrap"
          style={{ gap: "2px", minWidth: "120px" }}
        >
          <span className="text-muted small text-decoration-line-through me-1">
            ₹{oldP}
          </span>
          <i className="bi bi-arrow-right-short text-muted small"></i>
          <span className="fw-medium text-dark ms-1">₹{newP}</span>
        </div>
      </td>
    );
  }

  return (
    <td>
      <span className="text-dark">₹{newP}</span>
    </td>
  );
}
