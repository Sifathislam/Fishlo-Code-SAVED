import { useQuery } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

export const useManualOrderProducts = ({ search = "", category = "All" } = {}) => {
    const { api } = useAxios();

    return useQuery({
        queryKey: ["manual-order-products", search, category],
        queryFn: async ({ signal }) => {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (category && category !== "All") params.append("category", category);

            const res = await api.get(`store/manual-order-product-list/?${params.toString()}`, {
                signal,
            });
            return res.data;
        },
        staleTime: 60 * 1000,
    });
};
