import {
    ORDER_PAYMENT_STATUS_CHOICES,
    ORDER_TRACKING_STATUS_CHOICES
} from "./constants";

export default function OrdersFilter({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  paymentFilter,
  setPaymentFilter,

  dateRange,
  setDateRange,
  clearFilters
}) {
  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
      {/* Left: Search & Filters */}
      <div className="d-flex flex-wrap gap-2 align-items-center flex-grow-1">
        {/* Search Input - Glass Style */}
        <div
          className="sd-filter-bar flex-grow-1 flex-md-grow-0"
          style={{ minWidth: "260px" }}
        >
          <i className="bi bi-search text-secondary ms-2" />
          <input
            type="text"
            className="form-control border-0 bg-transparent shadow-none"
            placeholder="Order ID, Name, Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ fontSize: "0.9rem" }}
          />
        </div>

        {/* Status Filter */}
        <div className="sd-filter-bar">
          <select
            className="form-select border-0 bg-transparent shadow-none py-1 ps-2 pe-4"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}
          >
            <option value="ALL">All Status</option>
            {ORDER_TRACKING_STATUS_CHOICES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Filter */}
        <div className="sd-filter-bar">
          <select
            className="form-select border-0 bg-transparent shadow-none py-1 ps-2 pe-4"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}
          >
            <option value="ALL">All Payments</option>
            {ORDER_PAYMENT_STATUS_CHOICES.map((status) => (
              <option key={status} value={status}>
                {status === "PAID" ? "Online" : status}
              </option>
            ))}
            <option value="CASH">Offline</option>
          </select>
        </div>


      </div>

      {/* Right: Date Range Group */}
      <div className="sd-date-group flex-shrink-0">
        <i className="bi bi-calendar-event text-secondary small me-2"></i>
        <input
          type="date"
          className="sd-date-input"
          value={dateRange.start}
          onChange={(e) =>
            setDateRange({ ...dateRange, start: e.target.value })
          }
          onClick={(e) => e.target.showPicker && e.target.showPicker()}
        />
        <span className="text-muted small mx-1">to</span>
        <input
          type="date"
          className="sd-date-input"
          value={dateRange.end}
          onChange={(e) =>
            setDateRange({ ...dateRange, end: e.target.value })
          }
          onClick={(e) => e.target.showPicker && e.target.showPicker()}
        />
        {(dateRange.start ||
          dateRange.end ||
          statusFilter !== "ALL" ||
          searchQuery) && (
          <button
            className="btn btn-link text-danger p-0 ms-2"
            onClick={clearFilters}
            title="Reset Filters"
          >
            <i className="bi bi-x-circle-fill" />
          </button>
        )}
      </div>
    </div>
  );
}
