import { useQuery } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

export const useFishloMasalaProducts = () => {
  const { api } = useAxios();
  
  return useQuery({
    queryKey: ["products", "fishlo-masala"],
    queryFn: async () => {
      const sessionId = localStorage.getItem("fl_session_v1");
      const res = await api.get("/products/all/?category=fishlo-masala", {
        headers: { "X-Session-ID": sessionId || null },
      });
      return res.data;
    },
    staleTime: 1000 * 60 * 3,
    retry: 1,
  });
};
