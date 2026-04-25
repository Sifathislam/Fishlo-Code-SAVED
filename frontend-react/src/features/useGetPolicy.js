import { useQuery } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

export const useGetPolicy = (slug) => {
  const { api } = useAxios();

  return useQuery({
    queryKey: ["policy", slug],

    queryFn: async () => {
      const response = await api.get(`policy/${slug}/`);
      return response.data;
    },
    enabled: !!slug,           
    staleTime: 1000 * 60 * 60, 
    gcTime: 1000 * 60 * 120,  
    
    refetchOnWindowFocus: false,
    retry: 1, 
  });
};


export const useGetFAQs = () => {
  const { api } = useAxios();

  return useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const response = await api.get(`faqs/`); 
      return response.data;
    },
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    gcTime: 1000 * 60 * 120,  
  });
};
