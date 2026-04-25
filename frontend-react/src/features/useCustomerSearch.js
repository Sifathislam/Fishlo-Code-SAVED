import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

export const useCustomerSearch = (queryStr) => {
  const { api } = useAxios();
  const cleanPhone = (queryStr || "").replace(/\D/g, "");

  return useQuery({
    queryKey: ["customer-search", cleanPhone],
    queryFn: async ({ signal }) => {
      const res = await api.get(`store/customer-search/?q=${cleanPhone}`, { signal });
      return res.data.results || [];
    },
    enabled: cleanPhone.length >= 3,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000, // keep the data fresh for 1 minute
    refetchOnWindowFocus: false,
    retry: 1,
  });
};
