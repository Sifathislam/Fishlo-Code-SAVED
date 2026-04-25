import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  useAnalyticsSummary,
  useAnalyticsCharts,
  useAnalyticsTables,
  useAnalyticsCustomerInsights,
} from "../../features/useAnalyticsReports";

import ReportsHeader from "./reports/ReportsHeader";
import SummaryCards from "./reports/SummaryCards";
import SalesChart from "./reports/SalesChart";
import CategoryChart from "./reports/CategoryChart";
import TopProducts from "./reports/TopProducts";
import TopCustomers from "./reports/TopCustomers";
import CustomerInsightsCards from "./reports/CustomerInsightsCards";

import RepeatCustomers from "./reports/RepeatCustomers";
import NewCustomers from "./reports/NewCustomers";
import ReportsSkeleton from "./reports/ReportsSkeleton";

// --- CONSTANTS ---
const PIE_COLORS = ["#06b6d4", "#f59e0b", "#8b5cf6", "#10b981", "#ef4444", "#3b82f6", "#6366f1"];

export default function StoreReports() {
  document.title = "Reports - Store Dashboard";
  const { setIsMobileMenuOpen } = useOutletContext();
  const [dateRange, setDateRange] = useState("LAST_14");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [activeModal, setActiveModal] = useState(null);

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
  } = useAnalyticsSummary(filters);
  const {
    data: charts,
    isLoading: isChartsLoading,
    isError: isChartsError,
  } = useAnalyticsCharts(filters);
  const {
    data: tables,
    isLoading: isTablesLoading,
    isError: isTablesError,
  } = useAnalyticsTables(filters);
  const {
    data: customerData,
    isLoading: isCustomerLoading,
    isError: isCustomerError,
  } = useAnalyticsCustomerInsights(filters);

  const loading = isSummaryLoading || isChartsLoading || isTablesLoading || isCustomerLoading;
  const error = isSummaryError || isChartsError || isTablesError || isCustomerError
    ? "Error loading report data. Please check your connection."
    : null;

  // --- DERIVED DATA ---
  const chartData = charts?.sales_chart || [];

  const categoryData = useMemo(() => {
    return (charts?.sales_by_category || []).map((cat, idx) => ({
      name: cat.category,
      value: cat.percentage,
      color: PIE_COLORS[idx % PIE_COLORS.length],
      sell: cat.sell
    }));
  }, [charts]);

  const topProducts = tables?.top_products || [];
  const topCustomers = tables?.top_customers || [];

  const handleDownloadReport = () => {
    if (!chartData.length) return;
    // Generate CSV for Sales Trend
    const headers = ["Date", "Orders", "Sell"];
    const rows = chartData.map((d) => [
      d.full_date || d.date,
      d.orders,
      d.sell,
    ]);
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
      `store_sales_report_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid p-0">
      <ReportsHeader
        dateRange={dateRange}
        setDateRange={setDateRange}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
        handleDownloadReport={handleDownloadReport}
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
          <SummaryCards summary={summary} />
          {customerData && (
            <CustomerInsightsCards
              insights={customerData.insights}
              onNewClick={() => setActiveModal('new')}
              onReturningClick={() => setActiveModal('returning')}
            />
          )}

          {/* SALES & REVENUE */}
          <div className="row g-4 mb-4">
            <SalesChart chartData={chartData} />
            <CategoryChart categoryData={categoryData} />
          </div>

          {/*  PRODUCTS & CUSTOMERS */}
          <div className="row g-4">
            <TopProducts topProducts={topProducts} />
            <TopCustomers topCustomers={topCustomers} />
          </div>

          {/* CUSTOMER INSIGHTS MODALS */}
          {customerData && (
            <>
              <RepeatCustomers
                repeatCustomers={customerData.repeat_customers}
                isOpen={activeModal === 'returning'}
                onClose={() => setActiveModal(null)}
              />
              <NewCustomers
                newCustomers={customerData.new_customers}
                isOpen={activeModal === 'new'}
                onClose={() => setActiveModal(null)}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
