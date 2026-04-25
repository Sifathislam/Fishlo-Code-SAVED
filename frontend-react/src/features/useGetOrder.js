import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useAxios } from "../shared/hooks/useAxios";

export const useGetOrderSuccess = (orderId) => {
  const { api } = useAxios();

  return useQuery({
    queryKey: ["order-success", orderId],
    queryFn: async () => {
      const response = await api.get(`orders/details/${orderId}/`);
      return response.data.data;
    },
    staleTime: Infinity,
    enabled: !!orderId,
  });
};

export const useGetReconcile = () => {
  const { api } = useAxios();
  const authToken = Cookies.get("__Host-auth");

  return useQuery({
    queryKey: ["reconcile", authToken],
    queryFn: async () => {
      const response = await api.get(`orders/reconcile/`);
      return response.data?.data ?? [];
    },
    staleTime: 60000,
    retry: 1,
    enabled: !!authToken,
  });
};
