import React from "react";

export default function BIHeader({
  dateRange,
  setDateRange,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  handleExport,
  isExportDisabled,
}) {
  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end mb-4 gap-3">
      <div className="d-flex align-items-center gap-3">
        <div>
          <h2 className="sd-header-title mb-1">Business Intelligence</h2>
          <p className="sd-header-subtitle mb-0">
            Deep dive into operations, inventory, and logistics
          </p>
        </div>
      </div>

      <div className="sd-filter-container mt-3 mt-md-0">
        {/* Presets */}
        <div className="sd-filter-bar">
          <button
            className={`sd-filter-btn ${dateRange === "LAST_1" ? "active" : ""}`}
            onClick={() => setDateRange("LAST_1")}
          >
            Today
          </button>
          {["7", "14", "30", "90"].map((days) => (
            <button
              key={days}
              className={`sd-filter-btn ${dateRange === `LAST_${days}` ? "active" : ""
                }`}
              onClick={() => setDateRange(`LAST_${days}`)}
            >
              {days === "90" ? "3 Months" : `${days} Days`}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs */}
        <div className="sd-date-group">
          <i className="bi bi-calendar-event text-secondary small me-2"></i>
          <input
            type="date"
            className="sd-date-input"
            value={customStart}
            onChange={(e) => {
              setCustomStart(e.target.value);
              setDateRange("CUSTOM");
            }}
            onClick={(e) => e.target.showPicker && e.target.showPicker()}
          />
          <span className="text-muted small mx-1">to</span>
          <input
            type="date"
            className="sd-date-input"
            value={customEnd}
            onChange={(e) => {
              setCustomEnd(e.target.value);
              setDateRange("CUSTOM");
            }}
            onClick={(e) => e.target.showPicker && e.target.showPicker()}
          />
        </div>

        <button
          className="sd-export-btn"
          onClick={handleExport}
          disabled={isExportDisabled}
        >
          <i className="bi bi-cloud-download" /> <span>Export</span>
        </button>
      </div>
    </div>
  );
}
