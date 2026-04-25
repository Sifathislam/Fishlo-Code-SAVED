import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";
import { useEffect } from "react";

export const useSingleProduct = (slug) => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  const productQuery = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const sessionId = localStorage.getItem("fl_session_v1");
      const res = await api.get(`/products/${slug}/`, {
        headers: { "X-Session-ID": sessionId || null },
      });
      queryClient.invalidateQueries({ queryKey: ["recently-viewed"] });
      return res.data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 15,
    retry: 1,
  });

  const relatedQuery = useQuery({
    queryKey: ["related-products", slug],
    queryFn: async () => {
      const sessionId = localStorage.getItem("fl_session_v1");
      const res = await api.get(`/products/${slug}/related/`, {
        headers: { "X-Session-ID": sessionId || null },
      });
      return res.data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 15,
    retry: 1,
  });

  useEffect(() => {
    if (productQuery.isSuccess && productQuery.data) {
      queryClient.invalidateQueries({ 
        queryKey: ["recently-viewed"] 
      });
    }
  }, [productQuery.isSuccess, productQuery.data, queryClient, slug]);

  return {
    product: productQuery.data,
    relatedProducts: relatedQuery.data,
    isLoading: productQuery.isPending || relatedQuery.isPending,
    isError: productQuery.isError || relatedQuery.isError,
  };
};
