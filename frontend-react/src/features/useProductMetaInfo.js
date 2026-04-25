import { useQuery } from "@tanstack/react-query";
import { api } from "../shared/api";

export const useProductCombinedInfo = (id) => {
  const queryInfo = useQuery({
    queryKey: ["product-combined-info", id],
    queryFn: async () => {
      const [sourceRes, whatYouGetRes] = await Promise.all([
        api.get(`/products/source/${id}/`),
        api.get(`/products/what-you-get/${id}/`),
      ]);

      return {
        source: sourceRes.data,
        whatYouGet: whatYouGetRes.data,
      };
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    // Add this retry logic:
    retry: (failureCount, error) => {
      // Do not retry if the product is not found
      if (error?.response?.status === 404) {
        return false;
      }
      // For other errors, retry up to 2 times (default behavior)
      return failureCount < 2;
    },
    // Optional: Prevent refetching on window focus if it failed
    refetchOnWindowFocus: false,
  });

  return {
    ...queryInfo,
    ...(queryInfo.data || {}),
  };
};
