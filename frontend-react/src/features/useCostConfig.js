import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";


export const useGetCostConfig = () => {
  const { api } = useAxios();
  return useQuery({
    queryKey: ["storeCostConfig"],
    queryFn: async () => {
      const { data } = await api.get("store_management/cost-config/");
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 mins
  });
};

export const useUpdateCostConfig = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.patch("store_management/cost-config/", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["storeCostConfig"]);
      queryClient.invalidateQueries(["analytics", "profit"]);
    },
    onError: (error) => {
      console.error(error?.response?.data?.message || "Failed to update cost settings");
    },
  });
};

export const useGetCostHistory = () => {
  const { api } = useAxios();
  return useQuery({
    queryKey: ["storeCostHistory"],
    queryFn: async () => {
      const { data } = await api.get("store_management/cost-config/history/");
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 mins
  });
};

