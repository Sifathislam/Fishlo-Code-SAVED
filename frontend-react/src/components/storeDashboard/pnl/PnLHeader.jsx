import React from "react";
import { Download } from "lucide-react";

export default function PnLHeader({
  dateRange,
  setDateRange,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
}) {
  const handlePillClick = (range) => {
    setDateRange(range);
    setCustomStart("");
    setCustomEnd("");
  };

  const handleDateChange = (type, value) => {
    if (type === "start") setCustomStart(value);
    if (type === "end") setCustomEnd(value);
    setDateRange("CUSTOM");
  };

  return (
    <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3 mb-4">
      <div>
        <h4 className="fw-bold mb-1 text-dark fs-3">Profit & Loss</h4>
        <p className="text-muted small mb-0">Deep dive into store performance and growth trends</p>
      </div>

      <div className="d-flex flex-wrap align-items-center gap-3">
        {/* Date Presets Pill Group */}
        <div className="bg-white rounded-pill p-1 shadow-sm border d-flex align-items-center gap-1">
          <button
            className={`btn btn-sm rounded-pill fw-medium px-3 border-0 ${
              dateRange === "LAST_1" ? "btn-danger text-white shadow-sm" : "btn-white text-muted"
            }`}
            onClick={() => handlePillClick("LAST_1")}
          >
            Today
          </button>
          <button
            className={`btn btn-sm rounded-pill fw-medium px-3 border-0 ${
              dateRange === "LAST_7" ? "btn-danger text-white shadow-sm" : "btn-white text-muted"
            }`}
            onClick={() => handlePillClick("LAST_7")}
          >
            7 Days
          </button>
          <button
            className={`btn btn-sm rounded-pill fw-medium px-3 border-0 ${
              dateRange === "LAST_14" ? "btn-danger text-white shadow-sm" : "btn-white text-muted"
            }`}
            onClick={() => handlePillClick("LAST_14")}
          >
            14 Days
          </button>
          <button
            className={`btn btn-sm rounded-pill fw-medium px-3 border-0 ${
              dateRange === "LAST_30" ? "btn-danger text-white shadow-sm" : "btn-white text-muted"
            }`}
            onClick={() => handlePillClick("LAST_30")}
          >
            30 Days
          </button>
          <button
            className={`btn btn-sm rounded-pill fw-medium px-3 border-0 ${
              dateRange === "LAST_90" ? "btn-danger text-white shadow-sm" : "btn-white text-muted"
            }`}
            onClick={() => handlePillClick("LAST_90")}
          >
            3 Months
          </button>
        </div>

        {/* Custom Date Range Picker */}
        <div className="d-flex align-items-center bg-white rounded-pill px-3 py-1 shadow-sm border" style={{ height: "38px" }}>
          <i className="bi bi-calendar text-muted small me-2"></i>
          <div 
            className="position-relative d-flex align-items-center justify-content-center" 
            style={{ width: "110px", cursor: "pointer" }}
            onClick={(e) => {
              const input = e.currentTarget.querySelector('input');
              if (input && input.showPicker) input.showPicker();
            }}
          >
            <span className="text-muted small fw-medium text-center w-100 position-relative" style={{ zIndex: 1, pointerEvents: "none" }}>
              {customStart ? customStart.split('-').reverse().join('-') : 'DD-MM-YYYY'}
            </span>
            <input
              type="date"
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{ opacity: 0, zIndex: 0, cursor: "pointer" }}
              value={customStart}
              onChange={(e) => handleDateChange("start", e.target.value)}
            />
          </div>
          <span className="text-muted fw-bold px-2" style={{ fontSize: "10px" }}>TO</span>
          <div 
            className="position-relative d-flex align-items-center justify-content-center" 
            style={{ width: "110px", cursor: "pointer" }}
            onClick={(e) => {
              const input = e.currentTarget.querySelector('input');
              if (input && input.showPicker) input.showPicker();
            }}
          >
            <span className="text-muted small fw-medium text-center w-100 position-relative" style={{ zIndex: 1, pointerEvents: "none" }}>
              {customEnd ? customEnd.split('-').reverse().join('-') : 'DD-MM-YYYY'}
            </span>
            <input
              type="date"
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{ opacity: 0, zIndex: 0, cursor: "pointer" }}
              value={customEnd}
              onChange={(e) => handleDateChange("end", e.target.value)}
            />
          </div>
          <i className="bi bi-calendar text-muted small ms-2"></i>
        </div>

        {/* Export Button */}
        {/* <button
          className="btn btn-dark btn-sm rounded-pill d-flex align-items-center gap-2 px-3 fw-medium shadow-sm"
          style={{ height: "38px", backgroundColor: "#333e4f", borderColor: "#333e4f" }}
          onClick={() => window.print()}
        >
          <Download size={14} /> Export
        </button> */}
      </div>
    </div>
  );
}
