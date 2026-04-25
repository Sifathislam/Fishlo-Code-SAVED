import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useAxios } from "../shared/hooks/useAxios";

export const useProducts = (category, subcategory, inStock, sort, options = {}) => {
  const { api } = useAxios();

  return useQuery({
    // Include the new parameters in the queryKey so it refetches when they change
    queryKey: ["products", category, subcategory, inStock, sort],

    queryFn: async () => {
      const sessionId = localStorage.getItem("fl_session_v1");
      const response = await api.get("products/all/", {
        params: {
          category: category || undefined,
          subcategory: subcategory || undefined,
          in_stock: inStock ? 'true' : undefined,
          sort: sort && sort !== 'default' ? sort : undefined,
        },
        headers: {
          "X-Session-ID": sessionId || "",
        },
      });
      return response.data;
    },

    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
};

export const useMostLovedProducts = (options = {}) => {
  const { api } = useAxios();

  return useQuery({
    queryKey: ["products", "most-loved"],

    queryFn: async () => {
      const sessionId = localStorage.getItem("fl_session_v1");
      const response = await api.get("products/most-loved/", {
        headers: {
          "X-Session-ID": sessionId || "",
        },
      });
      return response.data;
    },

    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
};

export const useRecentlyViewedProducts = () => {
  const { api } = useAxios();
  const authToken = Cookies.get("__Host-auth");

  return useQuery({
    queryKey: ["recently-viewed", authToken],

    queryFn: async () => {
      const sessionId = localStorage.getItem("fl_session_v1");
      const response = await api.get("recently-viewed/", {
        headers: {
          "X-Session-ID": sessionId || "",
        },
      });
      return response.data;
    },

    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!authToken,
  });
};

export const useProductList = () => {
  const { api } = useAxios();

  return useQuery({
    queryKey: ["store", "product-simple-list"],
    queryFn: async () => {
      const response = await api.get("store/products/simple/");
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
