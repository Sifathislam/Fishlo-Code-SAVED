import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

export const useStockNotify = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/stock-notify/", data);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate the  list
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["related-products"] });
      queryClient.invalidateQueries({ queryKey: ["search-products"] });
    },
  });

  return {
    notifyStock: mutation.mutate,
    notifyStockAsync: mutation.mutateAsync,
    isNotifying: mutation.isPending,
    notifyError: mutation.error,
    ...mutation,
  };
};
