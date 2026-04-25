import { useMutation } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

export const useGetOnlineReceipt = () => {
    const { api } = useAxios();

    return useMutation({
        mutationFn: async (orderNumber) => {
            const res = await api.get(`store/online-receipt/${orderNumber}/`);
            return res.data;
        },
    });
};

export const useGetManualReceipt = () => {
    const { api } = useAxios();

    return useMutation({
        mutationFn: async ({ orderNumber, receiptType }) => {
            const url = receiptType
                ? `store/manual-order/receipt/${orderNumber}/?receipt_type=${receiptType}`
                : `store/manual-order/receipt/${orderNumber}/`;
            const res = await api.get(url);
            return res.data;
        },
    });
};
