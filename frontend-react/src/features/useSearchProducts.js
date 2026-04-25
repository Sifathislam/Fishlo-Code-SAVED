import { useQuery } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

export const useSearchProducts = (q) => {
  const { api } = useAxios();
  const trimmed = (q || "").trim(); // clean the text (remove spaces from start/end)

  return useQuery({
    queryKey: ["search-products", trimmed], // this key tells React Query which data we want to cache
    queryFn: async ({ signal }) => {
      const sessionId = localStorage.getItem("fl_session_v1");
      const params = new URLSearchParams({
        q: trimmed,
        limit: 20, // Request 20 up to maximum
      }).toString();
      const res = await api.get(`search-products/?${params}`, {
        headers: { "X-Session-ID": sessionId || null },
        signal,
      }); // "signal" lets us cancel old requests when typing fast
      return res.data;
    },
    enabled: trimmed.length >= 2, // only run search when text length is 2 or more
    staleTime: 60 * 1000, // keep the data fresh for 1 minute (no refetch if same query)
    refetchOnWindowFocus: false, // do not refetch when user clicks back to the tab
    retry: 1,
  });
};
