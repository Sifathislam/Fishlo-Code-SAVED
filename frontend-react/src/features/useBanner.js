import { useQuery } from "@tanstack/react-query";
import { api } from "../shared/api";

export const useGetBanners = () => {
  return useQuery({
    queryKey: ["banners"],

    queryFn: async () => {
      const response = await api.get("banners/");
      return response.data;
    },

    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

export const useGetPromotionBanners = (params) => {
  return useQuery({
    queryKey: ["promotion-banners", params],

    queryFn: async () => {
      const response = await api.get("promotion-banners/", { 
        params: params 
      });
      return response.data;
    },

    staleTime: 1000 * 60 * 5, 
    gcTime: 1000 * 60 * 30,  
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: !!params, 
  });
};
