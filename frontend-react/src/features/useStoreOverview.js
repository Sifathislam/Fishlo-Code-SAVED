import { useQuery } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

export const useStoreOverview = () => {
  const { api } = useAxios();

  return useQuery({
    queryKey: ["store", "store-overview"],
    queryFn: async () => {
      const response = await api.get("/store/overview/");
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Auto-refetch every 30 seconds
  });
};
