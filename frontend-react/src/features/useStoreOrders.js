import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

export const useStoreOrders = (filters = {}, queryOptions = {}) => {
  const { api } = useAxios();

  // Construct query key generic enough but specific to filters
  const queryKey = ["store", "store-orders", filters];

  return useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.page) params.append("page", filters.page);
      if (filters.status && filters.status !== "ALL") params.append("status", filters.status);
      if (filters.payment_status && filters.payment_status !== "ALL") params.append("payment_status", filters.payment_status);
      if (filters.search) params.append("search", filters.search);
      if (filters.date_start) params.append("created_at_after", filters.date_start);
      if (filters.date_end) params.append("created_at_before", filters.date_end);

      const response = await api.get(`/store/orders/?${params.toString()}`);
      return response.data;
    },
    placeholderData: keepPreviousData, // Keep data while fetching new page
    staleTime: 30000, // 30 seconds
    ...queryOptions, // Spread additional options like enabled
  });
};

export const useUpdateOrderStatus = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderNumber, status, cancellation_reason, refund_type, refund_amount, order_item_and_weights }) => {
      const response = await api.patch(`store/orders/${orderNumber}/status/`, {
        status,
        cancellation_reason,
        refundType: refund_type,
        refundAmount: refund_amount,
        order_item_and_weights
      });
      return response.data;
    },
    onMutate: async ({ orderNumber, status, cancellation_reason, refund_type, refund_amount }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["store", "store-orders"] });
      await queryClient.cancelQueries({ queryKey: ["store", "store-overview"] });
      await queryClient.cancelQueries({ queryKey: ["store", "store-orders-by-slots"] });

      // Snapshot the previous value
      const previousOrders = queryClient.getQueryData(["store", "store-orders"]);
      const previousOverview = queryClient.getQueryData(["store", "store-overview"]);

      // Optimistically update Store Orders List
      queryClient.setQueriesData({ queryKey: ["store", "store-orders"] }, (old) => {
        if (!old) return old;
        // Check if it's paginated data or array
        if (old.results) {
          return {
            ...old,
            results: old.results.map((order) =>
              order.order_number === orderNumber ? { ...order, status: status, cancellation_reason: cancellation_reason } : order
            ),
          };
        }
        return old;
      });

      // Optimistically update Store Overview (Recent Orders)
      queryClient.setQueryData(["store", "store-overview"], (old) => {
        if (!old || !old.recent_orders) return old;
        return {
          ...old,
          recent_orders: old.recent_orders.map((order) =>
            order.order_number === orderNumber ? { ...order, status: status, cancellation_reason: cancellation_reason } : order
          ),
        };
      });

      // Optimistically update Orders by Slots
      queryClient.setQueriesData({ queryKey: ["store", "store-orders-by-slots"] }, (old) => {
        if (!old || !old.orders) return old;
        return {
          ...old,
          orders: old.orders.map((order) =>
            order.order_number === orderNumber ? { ...order, status: status, cancellation_reason: cancellation_reason } : order
          ),
        };
      });

      // Return a context object with the snapshotted value
      return { previousOrders, previousOverview };
    },
    onError: (err, newTodo, context) => {
      // Rollback on error
      if (context?.previousOrders) {
        queryClient.setQueriesData({ queryKey: ["store", "store-orders"] }, context.previousOrders);
      }
      if (context?.previousOverview) {
        queryClient.setQueryData(["store", "store-overview"], context.previousOverview);
      }
      console.error("Failed to update status", err);
    },
    onSuccess: (data, variables) => {
      // If the status is successfully updated to PROCESSING, dispatch the print event
      if (variables.status === "PROCESSING") {
        window.dispatchEvent(
          new CustomEvent("printStoreReceipt", {
            detail: { orderNumber: variables.orderNumber },
          })
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: ["store", "store-overview"] });
      queryClient.invalidateQueries({ queryKey: ["store", "store-orders"] });
      queryClient.invalidateQueries({ queryKey: ["store", "store-orders-by-slots"] });
    },
  });
};

// ─── Orders By Slots (slot-based filtering, no pagination) ────────
export const useStoreOrdersBySlots = (filters = {}, queryOptions = {}) => {
  const { api } = useAxios();

  const queryKey = ["store", "store-orders-by-slots", filters];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.date) params.append("date", filters.date);
      if (filters.slot_id) params.append("slot_id", filters.slot_id);

      const response = await api.get(`/store/orders-by-slots/?${params.toString()}`);
      return response.data;
    },
    staleTime: 30000,
    placeholderData: keepPreviousData,
    ...queryOptions,
  });
};

export const useUpdatePaymentMethod = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderNumber, paymentMethod, notes }) => {
      const response = await api.patch(`store/orders/${orderNumber}/payment-method/`, {
        payment_method: paymentMethod,
        notes: notes
      });
      return response.data;
    },
    onMutate: async ({ orderNumber, paymentMethod }) => {
      await queryClient.cancelQueries({ queryKey: ["store", "store-orders"] });
      await queryClient.cancelQueries({ queryKey: ["store", "store-overview"] });
      await queryClient.cancelQueries({ queryKey: ["store", "store-orders-by-slots"] });

      const previousOrders = queryClient.getQueryData(["store", "store-orders"]);
      const previousOverview = queryClient.getQueryData(["store", "store-overview"]);

      // Optimistically update Store Orders List
      queryClient.setQueriesData({ queryKey: ["store", "store-orders"] }, (old) => {
        if (!old) return old;
        if (old.results) {
          return {
            ...old,
            results: old.results.map((order) =>
              order.order_number === orderNumber ? { ...order, payment_method: paymentMethod } : order
            ),
          };
        }
        return old;
      });

      // Optimistically update Store Overview
      queryClient.setQueryData(["store", "store-overview"], (old) => {
        if (!old || !old.recent_orders) return old;
        return {
          ...old,
          recent_orders: old.recent_orders.map((order) =>
            order.order_number === orderNumber ? { ...order, payment_method: paymentMethod } : order
          ),
        };
      });

      // Optimistically update Orders by Slots
      queryClient.setQueriesData({ queryKey: ["store", "store-orders-by-slots"] }, (old) => {
        if (!old || !old.orders) return old;
        return {
          ...old,
          orders: old.orders.map((order) =>
            order.order_number === orderNumber ? { ...order, payment_method: paymentMethod } : order
          ),
        };
      });

      return { previousOrders, previousOverview };
    },
    onError: (err, variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueriesData({ queryKey: ["store", "store-orders"] }, context.previousOrders);
      }
      if (context?.previousOverview) {
        queryClient.setQueryData(["store", "store-overview"], context.previousOverview);
      }
      console.error("Failed to update payment method", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["store", "store-overview"] });
      queryClient.invalidateQueries({ queryKey: ["store", "store-orders"] });
      queryClient.invalidateQueries({ queryKey: ["store", "store-orders-by-slots"] });
    },
  });
};

