import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { usePnLSummary, usePnLCharts } from "../../features/usePnLReports";
import { useExpenseList } from "../../features/useExpenses";

import PnLHeader from "./pnl/PnLHeader";
import PnLSummaryCards from "./pnl/PnLSummaryCards";
import RevenueVsCostChart from "./pnl/RevenueVsCostChart";
import ExpenseBreakdownChart from "./pnl/ExpenseBreakdownChart";
import ExpenseLog from "./pnl/ExpenseLog";
import ReportsSkeleton from "./reports/ReportsSkeleton";

export default function StorePnL() {
  document.title = "Profit & Loss - Store Dashboard";
  const { setIsMobileMenuOpen } = useOutletContext();

  // Date Filters (for cards and charts)
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

  // Queries
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError
  } = usePnLSummary(filters);

  const {
    data: charts,
    isLoading: isChartsLoading,
    isError: isChartsError
  } = usePnLCharts(filters);

  const loading = isSummaryLoading || isChartsLoading;
  const error = isSummaryError || isChartsError
    ? "Error loading Profit & Loss data. Please check your connection."
    : null;

  return (
    <div className="container-fluid p-0">
      <PnLHeader
        dateRange={dateRange}
        setDateRange={setDateRange}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
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

      {summary && (
        <>
          <PnLSummaryCards summary={summary} />

          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <RevenueVsCostChart chartData={charts?.monthly_trend || []} />
            </div>
            <div className="col-lg-4">
              <ExpenseBreakdownChart summary={summary} />
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <ExpenseLog filters={filters} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
