import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

// ---------------------------
// PRICING LIST
// ---------------------------
export const usePricingList = (search = "") => {
    const { api } = useAxios();

    return useQuery({
        queryKey: ["store", "pricing-list", search],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append("search", search);

            const response = await api.get(`store/pricing/?${params.toString()}`);
            return response.data;
        },
        staleTime: 1000 * 60, // 1 minute
    });
};

// ---------------------------
// CREATE PRICING
// ---------------------------
export const useCreatePricing = () => {
    const { api } = useAxios();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data) => {
            const response = await api.post("store/pricing/", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["store", "pricing-list"]);
            queryClient.invalidateQueries(["store", "pricing-history"]);
        },
    });
};

// ---------------------------
// UPDATE PRICING
// ---------------------------
export const useUpdatePricing = () => {
    const { api } = useAxios();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }) => {
            const response = await api.patch(`store/pricing-update/${id}/`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["store", "pricing-list"]);
            queryClient.invalidateQueries(["store", "pricing-history"]);
        },
    });
};

// ---------------------------
// PRICING HISTORY
// ---------------------------
export const usePricingHistory = (search = "") => {
    const { api } = useAxios();

    return useQuery({
        queryKey: ["store", "pricing-history", search],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append("search", search);

            const response = await api.get(`store/pricing/history/?${params.toString()}`);
            return response.data;
        },
        staleTime: 1000 * 60,
    });
};

export const usePricingHistoryExport = () => {
    const { api } = useAxios();

    return useMutation({
        mutationFn: async () => {
            const response = await api.get('store/pricing/history/export/', {
                responseType: 'blob',
            });
            return response.data;
        }
    })
}

// ---------------------------
// PRODUCT LIST (SIMPLE) MOVED TO useProduct.js
// ---------------------------
