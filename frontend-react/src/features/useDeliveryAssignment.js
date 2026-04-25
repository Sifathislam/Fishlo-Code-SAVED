import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

export const useDeliveryMen = ({ search = "", filters = {}, ...queryOptions } = {}) => {
  const { api } = useAxios();

  return useQuery({
    queryKey: ["delivery-app", "delivery-man-list", search, filters],
    queryFn: async () => {
      const response = await api.get("/delivery-app/delivery_man/list/", {
        params: {
          search,
          ...filters
        }
      });
      return response.data;
    },
    staleTime: 60000, // 1 minute
    ...queryOptions,
  });
};

export const useDashboardStats = (queryOptions = {}) => {
  const { api } = useAxios();

  return useQuery({
    queryKey: ["delivery-app", "dashboard-stats"],
    queryFn: async () => {
      const response = await api.get("/delivery-app/dashboard/");
      return response.data;
    },
    staleTime: 60000, // 1 minute
    ...queryOptions,
  });
};

export const usePartnerStatus = (queryOptions = {}) => {
  const { api } = useAxios();

  return useQuery({
    queryKey: ["delivery-app", "partner-status"],
    queryFn: async () => {
      const response = await api.get("/delivery-app/partner/status/");
      return response.data;
    },
    ...queryOptions,
  });
};

export const useUpdatePartnerStatus = (mutationOptions = {}) => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (is_active_duty) => {
      const response = await api.patch("/delivery-app/partner/status/", {
        is_active_duty,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["delivery-app", "partner-status"], data);
      queryClient.invalidateQueries(["delivery-app", "partner-status"]);
    },
    ...mutationOptions,
  });
};

export const useAssignRider = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ order_ids, delivery_partner_id, slot_id, delivery_date }) => {
      const response = await api.post("/store/delivery-man/assign/", {
        order_ids,
        delivery_partner_id,
        slot_id,
        delivery_date,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["store", "store-orders-by-slots"] });
      queryClient.invalidateQueries({ queryKey: ["store", "store-orders"] });
    },
  });
};

export const useMyAssignments = (queryOptions = {}) => {
  const { api } = useAxios();

  return useQuery({
    queryKey: ["delivery-app", "my-assignments"],
    queryFn: async () => {
      const response = await api.get("/delivery-app/assignments/my/");
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    ...queryOptions,
  });
};

export const useDeliveryHistory = (days = 30, queryOptions = {}) => {
  const { api } = useAxios();

  return useQuery({
    queryKey: ["delivery-app", "history", days],
    queryFn: async () => {
      const response = await api.get(`/delivery-app/assignments/my/?history=true&days=${days}`);
      return response.data;
    },
    ...queryOptions,
  });
};

export const useAcceptAssignment = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignment_id) => {
      const response = await api.post(`/delivery-app/assignments/accept/${assignment_id}/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-app", "my-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-app", "dashboard-stats"] });
    },
  });
};

export const useRejectAssignment = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignment_id) => {
      const response = await api.post(`/delivery-app/assignments/reject/${assignment_id}/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-app", "my-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-app", "dashboard-stats"] });
    },
  });
};

export const useAssignmentDetail = (order_number, queryOptions = {}) => {
  const { api } = useAxios();

  return useQuery({
    queryKey: ["delivery-app", "assignment-detail", order_number],
    queryFn: async () => {
      const response = await api.get(`/delivery-app/assignments/details/${order_number}/`);
      return response.data;
    },
    enabled: !!order_number,
    ...queryOptions,
  });
};

export const useVerifyDeliveryOTP = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ order_number, otp_code }) => {
      const response = await api.post("/delivery-app/order-delivery/verify-otp/", {
        order_number,
        otp_code,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["delivery-app", "assignment-detail", variables.order_number] });
      queryClient.invalidateQueries({ queryKey: ["delivery-app", "my-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-app", "dashboard-stats"] });
    },
  });
};

export const useWithdrawalHistory = (queryOptions = {}) => {
  const { api } = useAxios();

  return useQuery({
    queryKey: ["delivery-app", "withdrawal-history"],
    queryFn: async () => {
      const response = await api.get("/delivery-app/withdraw/history/");
      return response.data;
    },
    ...queryOptions,
  });
};

export const useRequestWithdrawal = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post("/delivery-app/withdraw/request/", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-app", "withdrawal-history"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-app", "dashboard-stats"] });
    },
  });
};

export const usePartnerProfile = (queryOptions = {}) => {
  const { api } = useAxios();

  return useQuery({
    queryKey: ["delivery-app", "partner-profile"],
    queryFn: async () => {
      const response = await api.get("/delivery-app/partner/profile/");
      return response.data;
    },
    staleTime: 300000, // 5 minutes
    ...queryOptions,
  });
};

export const useUpdateProfileImage = (mutationOptions = {}) => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      const response = await api.patch("/delivery-app/partner/profile/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-app", "partner-profile"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-app", "partner-status"] });
    },
    ...mutationOptions,
  });
};
export const useSendDeliveryOTP = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ order_number }) => {
      const response = await api.post(
        "/delivery-app/order-delivery/send-otp/",
        { order_number }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Optional: refresh assignment detail after sending OTP
      queryClient.invalidateQueries({
        queryKey: ["delivery-app", "assignment-detail", variables.order_number],
      });
    },
  });
};

export const useChangePassword = (mutationOptions = {}) => {
  const { api } = useAxios();

  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/delivery-app/partner/change-password/", data);
      return response.data;
    },
    ...mutationOptions,
  });
};