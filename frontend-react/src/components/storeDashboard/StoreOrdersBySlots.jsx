import { useEffect, useMemo, useState } from "react";
import { useStoreOrdersBySlots } from "../../features/useStoreOrders";
import { useAssignRider } from "../../features/useDeliveryAssignment";
import { useOrderActions } from "../../hooks/useOrderActions";
import DeliveryRequestModal from "./orders/DeliveryRequestModal";
import CancelOrderModal from "./shared/CancelOrderModal";
import ProcessingWeightModal from "./shared/ProcessingWeightModal";
import OrderDetailsModal from "./shared/OrderDetailsModal";
import SlotsHeader from "./shared/SlotsHeader";
import SlotsOrderTable from "./shared/SlotsOrderTable";
import SlotsStatsCard from "./shared/SlotsStatsCard";

export default function StoreOrdersBySlots() {
  document.title = "Orders by Slots - Store Dashboard";

  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [selectedDateSlot, setSelectedDateSlot] = useState("today");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [blinkingRows, setBlinkingRows] = useState(new Set());
  const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [requestedDrivers, setRequestedDrivers] = useState({});
  const [assignmentError, setAssignmentError] = useState(null);

  const assignRiderMutation = useAssignRider();

  // Fetch orders
  const {
    data: apiData,
    isLoading: loading,
    isFetching,
  } = useStoreOrdersBySlots({
    date: selectedDateSlot,
    slot_id: selectedSlotId || "",
  });

  const slots = apiData?.slots || [];
  // Only show skeleton on initial load (no cached data), NOT on background refetches (status changes)
  const isInitialLoading = selectedSlotId && loading && !apiData;
  const orders = selectedSlotId ? (apiData?.orders ?? []) : [];
  const summary = apiData?.summary ?? { total_orders: 0, total_weight: "0 kg" };

  // --- Effects ---

  // Auto-select first slot when slots load
  useEffect(() => {
    if (slots.length > 0 && !selectedSlotId) {
      setSelectedSlotId(slots[0].id);
    }
  }, [slots, selectedSlotId]);

  // Clean up selections when navigation/filters change
  // Combined the logic: if date changes, it resets slot; if slot resets, it clears IDs.
  useEffect(() => {
    setSelectedSlotId(null);
  }, [selectedDateSlot]);

  useEffect(() => {
    setSelectedOrderIds(new Set());
  }, [selectedSlotId]);

  // --- Memos ---

  const selectedOrder = useMemo(
    () => orders.find((o) => o.order_number === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  const activeSlot = useMemo(
    () => slots.find((s) => s.id === selectedSlotId) ?? null,
    [slots, selectedSlotId],
  );

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

  // --- Handlers ---

  const handleUpdateClick = async (orderId, newStatus, reason) => {
    try {
      if (reason) await handleUpdateStatus(orderId, newStatus, reason);
      else await handleUpdateStatus(orderId, newStatus);

      setBlinkingRows((prev) => new Set(prev).add(orderId));

      setTimeout(() => {
        setBlinkingRows((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
      }, 2500);
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const handleToggleSelect = (orderNumber) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      next.has(orderNumber) ? next.delete(orderNumber) : next.add(orderNumber);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    const packedOrders = orders.filter((o) => o.status === "PACKED");
    const allSelected =
      packedOrders.length > 0 && selectedOrderIds.size === packedOrders.length;

    setSelectedOrderIds(
      allSelected
        ? new Set()
        : new Set(packedOrders.map((o) => o.order_number)),
    );
  };

  const handleSendRequest = async (orderId, driverId) => {
    try {
      setAssignmentError(null);
      const orderIds = orderId === 'bulk' ? Array.from(selectedOrderIds) : [orderId];

      let formattedDate = null;
      if (selectedDateSlot) {
        const d = new Date();
        if (selectedDateSlot === 'today') {
          formattedDate = d.toISOString().split('T')[0];
        } else if (selectedDateSlot === 'tomorrow') {
          d.setDate(d.getDate() + 1);
          formattedDate = d.toISOString().split('T')[0];
        } else {
          formattedDate = selectedDateSlot;
        }
      }

      await assignRiderMutation.mutateAsync({
        order_ids: orderIds,
        delivery_partner_id: driverId,
        slot_id: selectedSlotId,
        delivery_date: formattedDate,
      });

      // After successful assignment, auto-close the modal and reset states
      setShowAssignModal(false);
      setRequestedDrivers({});
      setSelectedOrderIds(new Set());

    } catch (error) {
      console.error("Assignment failed", error);
      const errorMsg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to assign rider";
      setAssignmentError(errorMsg);
    }
  };

  return (
    <div className="container-fluid p-0">
      <SlotsHeader
        slots={slots}
        loading={loading}
        isFetching={isFetching}
        selectedSlotId={selectedSlotId}
        setSelectedSlotId={setSelectedSlotId}
        selectedDateSlot={selectedDateSlot}
        setSelectedDateSlot={setSelectedDateSlot}
      />

      <SlotsStatsCard
        activeSlot={activeSlot}
        summary={summary}
        loading={loading}
        selectedCount={selectedOrderIds.size}
        onAssignRidersClick={() =>
          selectedOrderIds.size > 0 && setShowAssignModal(true)
        }
      />

      <SlotsOrderTable
        orders={orders}
        loading={isInitialLoading} // Only show skeleton on first load, not on refetches
        isFetching={isFetching}
        activeSlot={activeSlot}
        setSelectedOrderId={setSelectedOrderId}
        setCancelModalOrder={setCancelModalOrder}
        onProcessingClick={setProcessingModalOrder}
        handleUpdateClick={handleUpdateClick}
        blinkingRows={blinkingRows}
        selectedOrderIds={selectedOrderIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
      />

      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrderId(null)}
        onUpdateStatus={handleUpdateStatus}
        onAcceptOrder={handleAcceptOrder}
        onCancelClick={setCancelModalOrder}
        onProcessingClick={setProcessingModalOrder}
      />

      <DeliveryRequestModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setRequestedDrivers({});
          setSelectedOrderIds(new Set());
        }}
        order={null}
        selectedOrderIds={Array.from(selectedOrderIds)}
        onRequestDriver={handleSendRequest}
        requestedDrivers={requestedDrivers}
        assignmentError={assignmentError}
        isAssigning={assignRiderMutation.isPending}
      />

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
