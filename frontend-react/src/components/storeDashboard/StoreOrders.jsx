import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useStoreOrders } from "../../features/useStoreOrders";
import { useOrderActions } from "../../hooks/useOrderActions";
import CancelOrderModal from "./shared/CancelOrderModal";
import OrderDetailsModal from "./shared/OrderDetailsModal";
import OrderTable from "./shared/OrderTable";
import OrderTableSkeleton from "./shared/OrderTableSkeleton";
import ProcessingWeightModal from "./shared/ProcessingWeightModal";

import DashboardPagination from "../dashboard/DashboardPagination";

import OrdersFilter from "./orders/OrdersFilter";

import useDebounce from "../../shared/hooks/useDebounce";

export default function StoreOrders() {
  document.title = "Orders - Store Dashboard";
  const { setIsMobileMenuOpen } = useOutletContext();
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [riderModalOrderId, setRiderModalOrderId] = useState(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const [currentPage, setCurrentPage] = useState(1);

  // Use Custom Hook
  const { data: ordersData, isLoading } = useStoreOrders({
    page: currentPage,
    status: statusFilter,
    payment_status: paymentFilter,
    date_start: dateRange.start,
    date_end: dateRange.end,
    search: debouncedSearchQuery,
  });

  // Derived State
  const orders = ordersData?.results || [];

  const selectedOrder =
    orders.find((o) => o.order_number === selectedOrderId) || null;

  const {
    cancelModalOrder,
    setCancelModalOrder,
    processingModalOrder,
    setProcessingModalOrder,
    isCancelling,
    isProcessing,
    handleUpdateStatus,
    handleAcceptOrder,
    handleConfirmCancel,
    handleConfirmProcessing,
  } = useOrderActions({ selectedOrder });

  const handleViewOrder = (order) => {
    setSelectedOrderId(order.order_number);
  };

  const clearFilters = () => {
    setStatusFilter("ALL");
    setPaymentFilter("ALL");

    setDateRange({ start: "", end: "" });
    setSearchQuery("");
  };

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div className="d-flex align-items-center gap-3">
          <div>
            <h2 className="sd-header-title mb-1">Orders Management</h2>
            <p className="sd-header-subtitle mb-0">
              Track and manage all store orders
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">{/* Export Removed */}</div>
      </div>

      {/* MODERN FILTER BAR */}
      <OrdersFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        paymentFilter={paymentFilter}
        setPaymentFilter={setPaymentFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
        clearFilters={clearFilters}
      />

      {/* Orders Table */}
      <div className="sd-table-card">
        {isLoading ? (
          <OrderTableSkeleton rowCount={6} />
        ) : (
          <OrderTable
            orders={orders}
            loading={isLoading}
            onViewOrder={(order) => {
              setSelectedOrderId(order.order_number);
            }}
            onUpdateStatus={handleUpdateStatus}
            onCancelClick={setCancelModalOrder}
            onProcessingClick={setProcessingModalOrder}
            showAssignAction={false}
          />
        )}
        {/* Pagination Controls */}
        <div className="d-flex justify-content-center p-3 border-top">
          <DashboardPagination
            currentPage={currentPage}
            totalCount={ordersData?.count || 0}
            pageSize={20} // Default page size from backend
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>

      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrderId(null)}
        onUpdateStatus={handleUpdateStatus}
        onAcceptOrder={handleAcceptOrder}
        onCancelClick={setCancelModalOrder}
        onProcessingClick={setProcessingModalOrder}
      />

      {/* Shared Cancellation Modal */}
      {cancelModalOrder && (
        <CancelOrderModal
          isOpen={!!cancelModalOrder}
          onClose={() => setCancelModalOrder(null)}
          orderNumber={cancelModalOrder?.order_number}
          totalAmount={cancelModalOrder?.price_details?.total_paid}
          onConfirmCancel={handleConfirmCancel}
          isCancelling={isCancelling}
        />
      )}

      {processingModalOrder && (
        <ProcessingWeightModal
          isOpen={!!processingModalOrder}
          onClose={() => setProcessingModalOrder(null)}
          order={processingModalOrder}
          onConfirmProcessing={handleConfirmProcessing}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}
