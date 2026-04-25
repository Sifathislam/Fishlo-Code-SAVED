import { useState } from "react";
import { useInventoryHistory } from "../../features/useStoreInventory";
import useDebounce from "../../shared/hooks/useDebounce";
import { formatDateTime } from "../../shared/utils/dateUtils";
// --- Component --- //

export default function StoreHistory() {
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [actionType, setActionType] = useState("ALL");
  const [page, setPage] = useState(1); // Pagination support if needed

  // API Hook
  const { data: historyData, isLoading } = useInventoryHistory({
    search: debouncedSearch,
    date_start: dateStart,
    date_end: dateEnd,
    action_type: actionType,
    page: page
  });

  // Helpers
  const formatStockLog = (str) => {
    if (!str || typeof str !== 'string') return str;
    const match = str.match(/^([+-]?)(\d+(?:\.\d+)?)(.*)$/);
    if (match) {
      return `${match[1]}${parseFloat(match[2])}${match[3]}`;
    }
    return str;
  };

  const getActionBadge = (action) => {
    switch (action) {
      case "RESTOCK":
        return <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill">Restock</span>;
      case "SALE":
        return <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 rounded-pill">Sale</span>;
      case "UPDATE":
        return <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill">Update</span>;
      case "ADJUSTMENT":
        return <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill">Adjustment</span>;
      case "RETURN":
        return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill">Return</span>;
      default:
        return <span className="badge bg-light text-dark border rounded-pill">{action}</span>;
    }
  };

  return (
    <div className="container-fluid p-0 fade-in">
      {/* History Visual Filters */}
      <div className="sd-filter-container mb-4 justify-content-between w-100">
        <div className="d-flex align-items-center bg-white border rounded-pill px-3 py-2 shadow-sm sd-search-box">
          <i className="bi bi-search text-muted me-2"></i>
          <input
            type="text"
            className="border-0 bg-transparent w-100 text-dark"
            style={{ outline: "none", fontSize: "0.95rem" }}
            placeholder="Search history log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {/* Inline Date Range Picker */}
          <div
            className="d-flex align-items-center bg-white border rounded-pill px-3 py-2 shadow-sm"
            style={{ height: "46px" }}
          >
            <i className="bi bi-calendar4 text-primary me-2"></i>
            <input
              type="date"
              className="border-0 bg-transparent text-secondary small fw-medium"
              style={{
                outline: "none",
                width: "140px",
                fontSize: "0.9rem",
                cursor: "pointer"
              }}
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
            />
            <span className="text-muted small mx-2">to</span>
            <input
              type="date"
              className="border-0 bg-transparent text-secondary small fw-medium"
              style={{
                outline: "none",
                width: "140px",
                fontSize: "0.9rem",
                cursor: "pointer"
              }}
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
            />
          </div>

          <select
            className="form-select rounded-pill shadow-sm border ps-3 py-2"
            style={{ width: "auto", cursor: "pointer" }}
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
          >
            <option value="ALL">All Actions</option>
            <option value="RESTOCK">Restock</option>
            <option value="SALE">Sale</option>
            <option value="UPDATE">Update</option>
            <option value="ADJUSTMENT">Adjustment</option>
            <option value="RETURN">Return</option>
          </select>

          <button
            className="btn btn-light border shadow-sm rounded-pill px-3 text-dark bg-light"
            title="Export"
            onClick={() => {/* TODO: Implement export */}}
          >
            <i className="bi bi-download"></i>
          </button>
        </div>
      </div>

      <div className="sd-table-card">
        <div className="sd-table-header bg-light">
          <h6 className="mb-0 fw-medium">Recent Activities</h6>
        </div>
        <div className="table-responsive">
            <table className="sd-table">
            <thead>
                <tr>
                <th>Date & Time</th>
                <th>Product</th>
                <th>Action</th>
                <th className="d-none d-md-table-cell">Old Weight</th>
                <th>Change</th>
                <th className="d-none d-lg-table-cell">User</th>
                <th className="d-none d-md-table-cell">Notes</th>
                </tr>
            </thead>
            <tbody>
                {isLoading ? (
                    <tr>
                        <td colSpan="7" className="text-center py-5">Loading history...</td>
                    </tr>
                ) : historyData?.results && historyData.results.length > 0 ? (
                historyData.results.map((log) => (
                    <tr key={log.id} className="sd-hover-row">
                    <td className="text-muted small fw-medium">
                        {formatDateTime(log.created_at)}
                    </td>
                    <td className="fw-medium text-dark">{log.product_name}</td>
                    <td>{getActionBadge(log.action_type)}</td>
                    <td className="text-secondary small fw-medium d-none d-md-table-cell">
                        {log.old_weight ? formatStockLog(log.old_weight) : "-"}
                    </td>
                    <td className="fw-medium text-dark">{formatStockLog(log.change)}</td>
                    <td className="text-muted small d-none d-lg-table-cell">
                        <i className="bi bi-person-circle me-1"></i> {log.user_name}
                    </td>
                    <td className="text-muted small fst-italic d-none d-md-table-cell">
                        {log.notes}
                    </td>
                    </tr>
                ))
                ) : (
                <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                    <i className="bi bi-search fs-1 opacity-25 d-block mb-2"></i>
                    No matching history found.
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
