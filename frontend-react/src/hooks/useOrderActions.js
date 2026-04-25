import { useState } from "react";
import { useUpdateOrderStatus } from "../features/useStoreOrders";

export function useOrderActions({ selectedOrder, setSelectedOrder } = {}) {
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [processingModalOrder, setProcessingModalOrder] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const updateStatusMutation = useUpdateOrderStatus();

  const handleUpdateStatus = (orderId, newStatus, payload) => {
    let reason = payload;
    let refund_type = null;
    let refund_amount = null;
    let order_item_and_weights = undefined;

    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      reason = payload.reason;
      refund_type = payload.refundType;
      refund_amount = payload.refundAmount;
      if (payload.order_item_and_weights) {
        order_item_and_weights = payload.order_item_and_weights;
      }
    } else if (Array.isArray(payload)) {
      // Direct array passing for order weights
      order_item_and_weights = payload;
      reason = null; // Reset — array is weights, not a cancellation reason
    }

    return updateStatusMutation.mutateAsync(
      {
        orderNumber: orderId,
        status: newStatus,
        cancellation_reason: reason,
        refund_type,
        refund_amount,
        order_item_and_weights,
      },
      {
        onSuccess: (data, variables) => {
          if (
            setSelectedOrder &&
            selectedOrder &&
            selectedOrder.order_number === variables.orderNumber
          ) {
            setSelectedOrder((prev) => ({
              ...prev,
              status: variables.status,
              cancellation_reason:
                variables.cancellation_reason || prev.cancellation_reason,
            }));
          }
        },
      },
    );
  };

  const handleAcceptOrder = (orderId) => {
    return handleUpdateStatus(orderId, "CONFIRMED");
  };

  const handleConfirmCancel = async (payload, setErrorMsg) => {
    try {
      setIsCancelling(true);
      setErrorMsg("");

      await handleUpdateStatus(
        cancelModalOrder.order_number,
        "CANCELLED",
        payload,
      );
      setCancelModalOrder(null);
    } catch (error) {
      console.error("Cancel failed", error);
      const msg =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to cancel the order";
      setErrorMsg(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmProcessing = async (orderId, weightsPayload, setErrorMsg) => {
    try {
      setIsProcessing(true);
      setErrorMsg("");

      await handleUpdateStatus(
        orderId,
        "PROCESSING",
        weightsPayload
      );
      setProcessingModalOrder(null);
    } catch (error) {
      console.error("Processing failed", error);
      const msg =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to process the order";
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
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
  };
}
