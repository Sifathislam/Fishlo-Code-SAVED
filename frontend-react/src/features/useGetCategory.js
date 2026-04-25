import { useQuery } from "@tanstack/react-query";
import { api } from "../shared/api";

export const useGetCategories = () => {
  return useQuery({
    queryKey: ["categories"],

    queryFn: async () => {
      const response = await api.get("categories/");
      return response.data;
    },

    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};
