import { useQuery } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

export const useDeliverySlots = () => {
    const { api } = useAxios();

    return useQuery({
        queryKey: ["delivery-slots"],
        queryFn: async () => {
            const res = await api.get("/delivery-slots-list/",);
            return res.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
    });
};
