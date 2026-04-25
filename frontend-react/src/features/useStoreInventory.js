import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

export const useStoreInventoryList = (filters = {}, queryOptions = {}) => {
    const { api } = useAxios();

    const queryKey = ["store", "inventory", filters];

    return useQuery({
        queryKey: queryKey,
        queryFn: async () => {
            const params = new URLSearchParams();

            if (filters.page) params.append("page", filters.page);
            if (filters.search) params.append("search", filters.search);

            // Backend uses 'tab' parameter for status filtering (all | low_stock | out_of_stock)
            if (filters.status && filters.status !== "ALL") {
                params.append("tab", filters.status.toLowerCase());
            }
            if (filters.tab) params.append("tab", filters.tab);

            const response = await api.get(`/store/inventory/?${params.toString()}`);
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 30000,
        ...queryOptions,
    });
};

export const useInventoryDetail = (id, queryOptions = {}) => {
    const { api } = useAxios();

    return useQuery({
        queryKey: ["store", "inventory", id],
        queryFn: async () => {
            const response = await api.get(`/store/inventory/${id}/`);
            return response.data;
        },
        enabled: !!id,
        ...queryOptions,
    });
};

export const useInventoryHistory = (filters = {}, queryOptions = {}) => {
    const { api } = useAxios();

    const queryKey = ["store", "inventory-history", filters];

    return useQuery({
        queryKey: queryKey,
        queryFn: async () => {
            const params = new URLSearchParams();

            if (filters.page) params.append("page", filters.page);
            if (filters.search) params.append("search", filters.search);

            // Backend uses 'start' and 'end' for date filtering
            if (filters.date_start) params.append("start", filters.date_start);
            if (filters.date_end) params.append("end", filters.date_end);

            if (filters.action_type && filters.action_type !== "ALL") {
                params.append("action_type", filters.action_type);
            }

            const response = await api.get(`/store/inventory/history/?${params.toString()}`);
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 30000,
        ...queryOptions,
    });
};

export const useCreateInventory = () => {
    const { api } = useAxios();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data) => {
            const response = await api.post("/store/inventory/", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["store", "inventory"] });
        },
    });
};

export const useUpdateInventory = () => {
    const { api } = useAxios();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }) => {
            const response = await api.patch(`/store/inventory/${id}/`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["store", "inventory"] });
            queryClient.invalidateQueries({ queryKey: ["store", "inventory-history"] });
        },
    });
};
