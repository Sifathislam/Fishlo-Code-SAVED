import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

export const useGetDashboardSummary = () => {
  const { api } = useAxios();
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      const { data } = await api.get("dashboard-summary/");
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

export const useGetMyOrders = (status, page = 1) => {
  const { api } = useAxios();
  return useQuery({
    queryKey: ["my-orders", status, page],
    queryFn: async () => {
      const response = await api.get(`my-orders/?status=${status}&page=${page}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    placeholderData: keepPreviousData,
  });
};

export const useGetOrderTracking = (orderId) => {
  const { api } = useAxios();
  return useQuery({
    queryKey: ["order-tracking", orderId],
    queryFn: async () => {
      const { data } = await api.get(`orders/tracking/${orderId}/`);
      return data;
    },
    enabled: !!orderId, // Only fetch if we have an ID
    refetchInterval: 1000 * 60, // Auto-refresh every 60 seconds
    staleTime: 1000 * 30, // Data considered fresh for 30s
    retry: 2,
  });
};

export const useUpdateProfile = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      const { data } = await api.patch("account/settings/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      // Refresh the data so the UI updates with the new info/image
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
};


export const useGetTransactionHistory = (page) => {
  const { api } = useAxios();
  return useQuery({
    queryKey: ["transactions-history", page],
    queryFn: async () => {
      const { data } = await api.get(`payments/history/?page=${page}`);
      return data;
    },
    staleTime: 1000 * 60 * 5, 
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: true, // Good for seeing payment status updates when returning to tab
    placeholderData: keepPreviousData,
  });
};
