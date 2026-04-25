import { useMutation, useQuery } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

export const useValidateCoupon = () => {
  const { api } = useAxios();

  return useMutation({
    mutationFn: async (discountCode) => {
      const response = await api.post("orders/validate-discount/", {
        discount_code: discountCode,
      });
      return response.data;
    },
  });
};

export const useGetAvailableCoupons = () => {
  const { api } = useAxios();

  return useQuery({
    queryKey: ["available-coupons"],
    queryFn: async () => {
      const response = await api.get("orders/available-discount-coupons/");
      return response.data;
    },

    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });
};
