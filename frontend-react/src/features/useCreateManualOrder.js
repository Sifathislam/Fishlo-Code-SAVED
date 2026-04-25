import { useMutation } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

export const useCreateManualOrder = () => {
  const { api } = useAxios();

  return useMutation({
    mutationFn: async (orderData) => {
      const res = await api.post("store/create-manual-order/", orderData);
      return res.data;
    },
  });
};
