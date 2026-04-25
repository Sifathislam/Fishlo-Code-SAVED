import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

// ─── Fetch Delivery Partners ────────
export const useStoreDeliveryPartners = (filters = {}, queryOptions = {}) => {
  const { api } = useAxios();

  const queryKey = ["store", "delivery-partners", filters];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.status && filters.status !== "All") params.append("status", filters.status);
      if (filters.vehicle_type && filters.vehicle_type !== "All Vehicles") params.append("vehicle_type", filters.vehicle_type);

      const response = await api.get(`/store/delivery-partners/?${params.toString()}`);
      return response.data;
    },
    staleTime: 30000,
    ...queryOptions,
  });
};

// ─── Create Delivery Partner ────────
export const useCreateDeliveryPartner = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partnerData) => {
      const response = await api.post("/store/delivery-partners/", partnerData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store", "delivery-partners"] });
    },
  });
};

// ─── Update Delivery Partner ────────
export const useUpdateDeliveryPartner = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }) => {
      const response = await api.patch(`/store/delivery-partners/${id}/`, updateData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store", "delivery-partners"] });
    },
  });
};

// ─── Deactivate Delivery Partner ────────
export const useDeactivateDeliveryPartner = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/store/delivery-partners/${id}/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store", "delivery-partners"] });
    },
  });
};
