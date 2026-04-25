const cardStyle = { flex: '1 1 0', minWidth: '100px' };

export default function SummaryCards({ summary }) {
  if (!summary) return null;

  return (
    <div className="d-flex flex-wrap gap-2 mb-3">
      {/* ── Total Sell ── */}
      <div style={cardStyle}>
        <div className="sd-brand-card p-2 px-3 h-100">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-success-subtle rounded text-success">
              <i className="bi bi-currency-rupee fs-5" />
            </div>
            <div>
              <div className="text-muted small mb-0 fw-medium">Total Sell</div>
              <div className="fs-6 fw-bold text-dark mb-0">
                ₹{summary.total_sell.toLocaleString()}
              </div>
              {summary.sell_change_pct !== null && (
                <div style={{ fontSize: "0.7rem" }} className={`fw-medium ${summary.sell_change_pct >= 0 ? "text-success" : "text-danger"}`}>
                  <i className={`bi ${summary.sell_change_pct >= 0 ? "bi-arrow-up-right" : "bi-arrow-down-right"} me-1`} />
                  {Math.abs(summary.sell_change_pct)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Total Orders ── */}
      <div style={cardStyle}>
        <div className="sd-brand-card p-2 px-3 h-100">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-primary-subtle rounded text-primary">
              <i className="bi bi-bag-check fs-5" />
            </div>
            <div>
              <div className="text-muted small mb-0 fw-medium">Orders</div>
              <div className="fs-6 fw-bold text-dark mb-0">{summary.total_orders}</div>
              {summary.orders_change_pct !== null && (
                <div style={{ fontSize: "0.7rem" }} className={`fw-medium ${summary.orders_change_pct >= 0 ? "text-success" : "text-danger"}`}>
                  <i className={`bi ${summary.orders_change_pct >= 0 ? "bi-arrow-up-right" : "bi-arrow-down-right"} me-1`} />
                  {Math.abs(summary.orders_change_pct)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Avg. Order Value ── */}
      <div style={cardStyle}>
        <div className="sd-brand-card p-2 px-3 h-100">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-warning-subtle rounded text-warning">
              <i className="bi bi-cart-plus fs-5" />
            </div>
            <div>
              <div className="text-muted small mb-0 fw-medium">Avg. Order</div>
              <div className="fs-6 fw-bold text-dark mb-0">
                ₹{summary.avg_order_value.toLocaleString()}
              </div>
              {summary.avg_order_change_pct !== null && (
                <div style={{ fontSize: "0.7rem" }} className={`fw-medium ${summary.avg_order_change_pct >= 0 ? "text-success" : "text-danger"}`}>
                  <i className={`bi ${summary.avg_order_change_pct >= 0 ? "bi-arrow-up-right" : "bi-arrow-down-right"} me-1`} />
                  {Math.abs(summary.avg_order_change_pct)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Avg. Daily Sale ── */}
      <div style={cardStyle}>
        <div className="sd-brand-card p-2 px-3 h-100">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 rounded" style={{ backgroundColor: "#e0f2f1", color: "#00897b" }}>
              <i className="bi bi-calendar2-day fs-5" />
            </div>
            <div>
              <div className="text-muted small mb-0 fw-medium">Avg. Daily</div>
              <div className="fs-6 fw-bold text-dark mb-0">
                ₹{summary.avg_daily_sale.toLocaleString()}
              </div>
              {summary.avg_daily_change_pct !== null && (
                <div style={{ fontSize: "0.7rem" }} className={`fw-medium ${summary.avg_daily_change_pct >= 0 ? "text-success" : "text-danger"}`}>
                  <i className={`bi ${summary.avg_daily_change_pct >= 0 ? "bi-arrow-up-right" : "bi-arrow-down-right"} me-1`} />
                  {Math.abs(summary.avg_daily_change_pct)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Cash Collected ── */}
      <div style={cardStyle}>
        <div className="sd-brand-card p-2 px-3 h-100">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-success-subtle rounded text-success">
              <i className="bi bi-cash-stack fs-5" />
            </div>
            <div>
              <div className="text-muted small mb-0 fw-medium">Cash</div>
              <div className="fs-6 fw-bold text-dark mb-0">
                ₹{summary.cash_collected?.toLocaleString() || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── UPI Collected ── */}
      <div style={cardStyle}>
        <div className="sd-brand-card p-2 px-3 h-100">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 rounded" style={{ backgroundColor: "#e0e7ff", color: "#4f46e5" }}>
              <i className="bi bi-phone fs-5" />
            </div>
            <div>
              <div className="text-muted small mb-0 fw-medium">UPI</div>
              <div className="fs-6 fw-bold text-dark mb-0">
                ₹{summary.upi_collected?.toLocaleString() || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Masala Revenue ── */}
      <div style={cardStyle}>
        <div className="sd-brand-card p-2 px-3 h-100">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-warning-subtle rounded text-warning">
              <i className="bi bi-box-seam fs-5" />
            </div>
            <div>
              <div className="text-muted small mb-0 fw-medium">Masala</div>
              <div className="fs-6 fw-bold text-dark mb-0">
                ₹{summary.masala_revenue?.toLocaleString() || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
