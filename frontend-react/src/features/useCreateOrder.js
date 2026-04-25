import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

export const useCreateOrder = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderData) => {
      const response = await api.post("orders/create/", orderData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    },
  });
};

export const useVerifyPayment = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (verificationData) => {
      const response = await api.post(
        "orders/verify-payment/",
        verificationData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      queryClient.invalidateQueries({ queryKey: ["transactions-history"] });
    },
  });
};

export const useDownloadInvoice = (orderId) => {
  const { api } = useAxios();

  return useQuery({
    queryKey: ["invoice", orderId],
    queryFn: async () => {
      const response = await api.get(`orders/invoice/download/${orderId}/`);
      return response.data;
    },
    enabled: !!orderId,
  });
};


export const useCancelOrder = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderNumber) => {
      const response = await api.post(`orders/cancel-order/`, {
        order_number: orderNumber
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    },
  });
};

export const useCancelOrderWithRefund = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderNumber, reason }) => {
      const response = await api.post(`orders/cancel-order-with-refund/`, {
        order_number: orderNumber,
        reason: reason
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    },
  });
};
