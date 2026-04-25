import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import "react-loading-skeleton/dist/skeleton.css";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  useStoreOrders,
} from "../../features/useStoreOrders";
import { useOrderActions } from "../../hooks/useOrderActions";
import { useStoreOverview } from "../../features/useStoreOverview";
import OrderDetailsModal from "./shared/OrderDetailsModal";
import OrderTable from "./shared/OrderTable";
import CancelOrderModal from "./shared/CancelOrderModal";
import ProcessingWeightModal from "./shared/ProcessingWeightModal";
import OrderTableSkeleton from "./shared/OrderTableSkeleton";

import DashboardPagination from "../dashboard/DashboardPagination";
import OverviewStats from "./overview/OverviewStats";
import { useGetStoreManagerInfo } from "../../features/useGetProfile";
import Skeleton from "react-loading-skeleton";

export default function StoreOverview() {
  document.title = "Overview - Store Dashboard";
  const { setIsMobileMenuOpen } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isRefetching = useIsFetching({ queryKey: ["store"] }) > 0;
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (!isRefetching) {
      setIsSpinning(false);
    }
  }, [isRefetching]);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [statusPage, setStatusPage] = useState(1); // Pagination State

  const { data: overviewData, isLoading } = useStoreOverview();
  const { data: storeInfo, isLoading: isStoreInfoLoading } = useGetStoreManagerInfo();

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
  } = useOrderActions({ selectedOrder, setSelectedOrder });

  const stats = overviewData?.stats || {
    PENDING: 0,
    PACKED: 0,
    OUT_FOR_DELIVERY: 0,
    PROCESSING: 0,
    DELIVERED: 0,
    CONFIRMED: 0,
    CANCELLED: 0,
  };
  const orders = overviewData?.recent_orders || [];

  const { data: statusOrdersData, isLoading: isStatusLoading } = useStoreOrders(
    { status: selectedStatus, page: statusPage },
    { enabled: !!selectedStatus },
  );

  const filteredOrders = statusOrdersData?.results || [];

  const handleCardClick = (status) => {
    if (selectedStatus === status) {
      setSelectedStatus(null);
    } else {
      setSelectedStatus(status);
      setStatusPage(1); // Reset to page 1 on status change
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  return (
    <>
      <div className="container-fluid p-0">
        {/*  Brand Header */}
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div className="d-flex align-items-center gap-3">
            {/* Mobile Hamburger Removed */}
            <div>
              <h2 className="sd-header-title mb-1">Store Overview</h2>
              {isStoreInfoLoading ? (
                <Skeleton width={150} height={15} />
              ) : (
                <p className="sd-header-subtitle mb-0">
                  Welcome back, {storeInfo?.data?.first_name || "Manager"}
                </p>
              )}
            </div>
          </div>
          <div className="d-flex gap-3">
            <div className="d-flex gap-3">
              <button
                className="sd-btn-ghost"
                onClick={() => {
                  setIsSpinning(true);
                  queryClient.invalidateQueries({ queryKey: ["store"] });
                }}
              >
                <i
                  className={`bi bi-arrow-clockwise me-2 ${isSpinning ? "spin" : ""}`}
                />{" "}
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/*  Hero Stats Row */}
        <OverviewStats
          stats={stats}
          isLoading={isLoading}
          selectedStatus={selectedStatus}
          onCardClick={handleCardClick}
        />

        {selectedStatus && (
          <div className="row g-4 mb-4">
            <div className="col-12">
              <div className="sd-table-card">
                <div className="sd-table-header">
                  <h5
                    className="mb-0 fw-medium"
                    style={{ color: "var(--fishlo-gray)" }}
                  >
                    {selectedStatus === "OUT_FOR_DELIVERY"
                      ? "Dispatched"
                      : selectedStatus === "PACKED"
                        ? "Pack"
                        : selectedStatus.charAt(0) +
                        selectedStatus.slice(1).toLowerCase()}{" "}
                    Orders
                  </h5>
                  <button
                    className="sd-btn-ghost btn-sm"
                    onClick={() => setSelectedStatus(null)}
                  >
                    <i className="bi bi-x-lg" /> Close
                  </button>
                </div>
                {isStatusLoading ? (
                  <OrderTableSkeleton rowCount={6} />
                ) : (
                  <OrderTable
                    orders={filteredOrders}
                    onViewOrder={handleViewOrder}
                    onUpdateStatus={handleUpdateStatus}
                    onCancelClick={setCancelModalOrder}
                    onProcessingClick={setProcessingModalOrder}
                  />
                )}
                {/* Pagination Controls */}
                {statusOrdersData?.count > 20 && (
                  <div className="d-flex justify-content-center p-3 border-top">
                    <DashboardPagination
                      currentPage={statusPage}
                      totalCount={statusOrdersData?.count || 0}
                      pageSize={20}
                      onPageChange={(page) => setStatusPage(page)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="row g-4">
          {/*  Main Content: Order List */}
          <div className="col-12">
            <div className="sd-table-card">
              <div className="sd-table-header">
                <h5
                  className="mb-0 fw-medium"
                  style={{ color: "var(--fishlo-gray)" }}
                >
                  Recent Orders
                </h5>
                <button
                  className="sd-btn-ghost btn-sm"
                  onClick={() => navigate("/store/orders")}
                >
                  View All
                </button>
              </div>
              {isLoading ? (
                <OrderTableSkeleton rowCount={6} />
              ) : (
                <OrderTable
                  orders={orders}
                  onViewOrder={handleViewOrder}
                  onUpdateStatus={handleUpdateStatus}
                  onCancelClick={setCancelModalOrder}
                  onProcessingClick={setProcessingModalOrder}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatus}
        onAcceptOrder={handleAcceptOrder}
        onCancelClick={setCancelModalOrder}
        onProcessingClick={setProcessingModalOrder}
      />

      {/* Shared Cancellation Modal */}
      {
        cancelModalOrder && (
          <CancelOrderModal
            isOpen={!!cancelModalOrder}
            onClose={() => setCancelModalOrder(null)}
            orderNumber={cancelModalOrder?.order_number}
            totalAmount={cancelModalOrder?.price_details?.total_paid}
            onConfirmCancel={handleConfirmCancel}
            isCancelling={isCancelling}
          />
        )
      }

      {processingModalOrder && (
        <ProcessingWeightModal
          isOpen={!!processingModalOrder}
          onClose={() => setProcessingModalOrder(null)}
          order={processingModalOrder}
          onConfirmProcessing={handleConfirmProcessing}
          isProcessing={isProcessing}
        />
      )}
    </>
  );
}
