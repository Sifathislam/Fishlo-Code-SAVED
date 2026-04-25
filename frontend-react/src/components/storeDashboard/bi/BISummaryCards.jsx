import React from "react";

export default function BISummaryCards({ summary }) {
  if (!summary) return null;

  return (
    <div className="row g-4 mb-4">
      <div className="col-lg-4 col-md-6">
        <div className="sd-brand-card p-4">
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-3 flex-shrink-0"
              style={{ width: "48px", height: "48px" }}
            >
              <i className="bi bi-box-seam fs-4" />
            </div>
            <div>
              <div className="sd-stat-label mb-1">Avg Packing Time</div>
              <div className="h3 fw-medium mb-0 text-dark">
                {summary.avg_packing_time_min ?? "0"}{" "}
                {summary.avg_packing_time_min !== null ? "min" : ""}
              </div>
              {summary.packing_change_pct !== null && (
                <div
                  className={`small fw-medium mt-1 ${
                    summary.packing_change_pct <= 0
                      ? "text-success"
                      : "text-danger"
                  }`}
                >
                  <i
                    className={`bi ${
                      summary.packing_change_pct <= 0
                        ? "bi-arrow-down-right"
                        : "bi-arrow-up-right"
                    } me-1`}
                  />
                  {Math.abs(summary.packing_change_pct)}%{" "}
                  <span className="text-muted fw-normal ms-1">
                    {summary.packing_change_pct <= 0 ? "faster" : "slower"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="col-lg-4 col-md-6">
        <div className="sd-brand-card p-4">
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center bg-warning-subtle text-warning rounded-3 flex-shrink-0"
              style={{ width: "48px", height: "48px" }}
            >
              <i className="bi bi-bicycle fs-4" />
            </div>
            <div>
              <div className="sd-stat-label mb-1">Avg Delivery Time</div>
              <div className="h3 fw-medium mb-0 text-dark">
                {summary.avg_delivery_time_min ?? "0"}{" "}
                {summary.avg_delivery_time_min !== null ? "min" : ""}
              </div>
              {summary.delivery_change_pct !== null && (
                <div
                  className={`small fw-medium mt-1 ${
                    summary.delivery_change_pct <= 0
                      ? "text-success"
                      : "text-danger"
                  }`}
                >
                  <i
                    className={`bi ${
                      summary.delivery_change_pct <= 0
                        ? "bi-arrow-down-right"
                        : "bi-arrow-up-right"
                    } me-1`}
                  />
                  {Math.abs(summary.delivery_change_pct)}%{" "}
                  <span className="text-muted fw-normal ms-1">
                    {summary.delivery_change_pct <= 0 ? "faster" : "slower"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="col-lg-4 col-md-12">
        <div className="sd-brand-card p-4">
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center bg-success-subtle text-success rounded-3 flex-shrink-0"
              style={{ width: "48px", height: "48px" }}
            >
              <i className="bi bi-arrow-return-left fs-4" />
            </div>
            <div>
              <div className="sd-stat-label mb-1">Return Rate</div>
              <div className="h3 fw-medium mb-0 text-dark">
                {summary.return_rate_pct}%
              </div>
              {summary.return_rate_change_pct !== null && (
                <div
                  className={`small fw-medium mt-1 ${
                    summary.return_rate_change_pct <= 0
                      ? "text-success"
                      : "text-danger"
                  }`}
                >
                  <i
                    className={`bi ${
                      summary.return_rate_change_pct <= 0
                        ? "bi-arrow-down-right"
                        : "bi-arrow-up-right"
                    } me-1`}
                  />
                  {Math.abs(summary.return_rate_change_pct)}% vs prev
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
