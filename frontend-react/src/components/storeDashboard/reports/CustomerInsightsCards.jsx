export default function CustomerInsightsCards({ insights, onNewClick, onReturningClick }) {
  if (!insights) return null;

  return (
    <div className="d-flex flex-wrap gap-2 mb-3">
      <div style={{ flex: '1 1 0', minWidth: '100px' }}>
        <div className="sd-brand-card p-2 px-3 h-100">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-info-subtle rounded text-info">
              <i className="bi bi-people fs-5" />
            </div>
            <div>
              <div className="text-muted small mb-0 fw-medium">Total Customers</div>
              <div className="fs-6 fw-bold text-dark mb-0">
                {insights.total_unique_customers}
              </div>
              {insights.total_change_pct !== null && (
                <div style={{ fontSize: "0.7rem" }} className={`fw-medium ${insights.total_change_pct >= 0 ? "text-success" : "text-danger"}`}>
                  <i className={`bi ${insights.total_change_pct >= 0 ? "bi-arrow-up-right" : "bi-arrow-down-right"} me-1`} />
                  {Math.abs(insights.total_change_pct)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ flex: '1 1 0', minWidth: '100px' }} onClick={onNewClick} role="button" tabIndex={0}>
        <div className="sd-brand-card p-2 px-3 h-100 hover-shadow transition-all">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-success-subtle rounded text-success">
              <i className="bi bi-person-plus fs-5" />
            </div>
            <div>
              <div className="text-muted small mb-0 fw-medium">New Customers</div>
              <div className="fs-6 fw-bold text-dark mb-0">
                {insights.new_customers}
              </div>
              {insights.new_change_pct !== null && (
                <div style={{ fontSize: "0.7rem" }} className={`fw-medium ${insights.new_change_pct >= 0 ? "text-success" : "text-danger"}`}>
                  <i className={`bi ${insights.new_change_pct >= 0 ? "bi-arrow-up-right" : "bi-arrow-down-right"} me-1`} />
                  {Math.abs(insights.new_change_pct)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: '1 1 0', minWidth: '100px' }} onClick={onReturningClick} role="button" tabIndex={0}>
        <div className="sd-brand-card p-2 px-3 h-100 hover-shadow transition-all">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-primary-subtle rounded text-primary">
              <i className="bi bi-arrow-repeat fs-5" />
            </div>
            <div>
              <div className="text-muted small mb-0 fw-medium">Returning</div>
              <div className="fs-6 fw-bold text-dark mb-0">
                {insights.returning_customers}
              </div>
              {insights.returning_change_pct !== null && (
                <div style={{ fontSize: "0.7rem" }} className={`fw-medium ${insights.returning_change_pct >= 0 ? "text-success" : "text-danger"}`}>
                  <i className={`bi ${insights.returning_change_pct >= 0 ? "bi-arrow-up-right" : "bi-arrow-down-right"} me-1`} />
                  {Math.abs(insights.returning_change_pct)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: '1 1 0', minWidth: '100px' }}>
        <div className="sd-brand-card p-2 px-3 h-100">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-warning-subtle rounded text-warning">
              <i className="bi bi-graph-up-arrow fs-5" />
            </div>
            <div>
              <div className="text-muted small mb-0 fw-medium">Repeat Rate</div>
              <div className="fs-6 fw-bold text-dark mb-0">
                {insights.repeat_rate_pct}%
              </div>
              <div style={{ fontSize: "0.7rem" }} className="fw-medium text-muted">
                Of total customers
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
