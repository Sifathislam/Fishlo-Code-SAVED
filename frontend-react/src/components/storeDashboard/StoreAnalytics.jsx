import { useState, useMemo } from "react";
import {
  useBISummary,
  useBICharts,
  useBICustomers,
  useBIRiders,
} from "../../features/useBIAnalytics";
import ReportsSkeleton from "./reports/ReportsSkeleton";

// BI Sub-components
import BIHeader from "./bi/BIHeader";
import BISummaryCards from "./bi/BISummaryCards";
import OperationalEfficiencyChart from "./bi/OperationalEfficiencyChart";
import VolumeHeatmap from "./bi/VolumeHeatmap";
import RetentionChart from "./bi/RetentionChart";
import RiderPerformanceMatrix from "./bi/RiderPerformanceMatrix";

export default function StoreAnalytics() {
  document.title = "Analytics - Store Dashboard";
  const [dateRange, setDateRange] = useState("LAST_14");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const filters = useMemo(
    () => ({
      period: dateRange,
      start: customStart,
      end: customEnd,
    }),
    [dateRange, customStart, customEnd]
  );

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
  } = useBISummary(filters);
  const {
    data: charts,
    isLoading: isChartsLoading,
    isError: isChartsError,
  } = useBICharts(filters);
  const {
    data: customers,
    isLoading: isCustomersLoading,
    isError: isCustomersError,
  } = useBICustomers(filters);
  const {
    data: riders,
    isLoading: isRidersLoading,
    isError: isRidersError,
  } = useBIRiders(filters);

  const loading = isSummaryLoading || isChartsLoading || isCustomersLoading || isRidersLoading;
  const error = isSummaryError || isChartsError || isCustomersError || isRidersError
    ? "Error loading BI data. Please check your connection."
    : null;

  // --- DERIVED DATA ---
  const operationalSpeed = charts?.operational_efficiency || [];
  const heatmap = charts?.heatmap || { hours: [], days: [], grid: [] };
  const retentionData = customers || [];
  const riderPerformance = riders || [];

  const handleExport = () => {
    if (!operationalSpeed.length) return;
    const headers = ["Day", "Packing Time (mins)", "Delivery Time (mins)"];
    const rows = operationalSpeed.map((d) => [d.day, d.packing_min, d.delivery_min]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `store_bi_analytics_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid p-0">
      <BIHeader
        dateRange={dateRange}
        setDateRange={setDateRange}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
        handleExport={handleExport}
        isExportDisabled={!operationalSpeed.length}
      />

      {loading && !summary && (
        <div className="mt-4">
          <ReportsSkeleton />
        </div>
      )}

      {error && (
        <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>{error}</div>
        </div>
      )}

      {summary && <BISummaryCards summary={summary} />}

      {charts && (
        <div className="row g-4 mb-4">
          <div className="col-lg-8">
            <OperationalEfficiencyChart data={operationalSpeed} />
          </div>
          <div className="col-lg-4">
            <VolumeHeatmap heatmap={heatmap} />
          </div>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-6">
          <RetentionChart data={retentionData} />
        </div>
        <div className="col-lg-6">
          <RiderPerformanceMatrix data={riderPerformance} />
        </div>
      </div>
    </div>
  );
}

