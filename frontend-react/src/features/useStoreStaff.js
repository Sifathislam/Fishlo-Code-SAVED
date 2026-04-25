import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

// Fetch Staff List with Filters/Search
export const useStoreStaff = (filters = {}, queryOptions = {}) => {
  const { api } = useAxios();

  const queryKey = ["store", "staff", filters];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.status && filters.status !== "All") params.append("status", filters.status);
      if (filters.role && filters.role !== "All") params.append("role", filters.role);

      const response = await api.get(`/staff_management/staff/?${params.toString()}`);
      return response.data;
    },
    staleTime: 30000,
    ...queryOptions,
  });
};

// Fetch Single Staff Detail
export const useStaffDetail = (id, queryOptions = {}) => {
  const { api } = useAxios();

  return useQuery({
    queryKey: ["store", "staff", "detail", id],
    queryFn: async () => {
      const response = await api.get(`/staff_management/staff/${id}/`);
      return response.data;
    },
    enabled: !!id,
    ...queryOptions,
  });
};

// Fetch Staff Form Choices (Roles, Shifts, Statuses)
export const useStaffFormChoices = () => {
  const { api } = useAxios();

  return useQuery({
    queryKey: ["store", "staff", "choices"],
    queryFn: async () => {
      const response = await api.get("/staff_management/staff/choices/");
      return response.data;
    },
    staleTime: 300000, // 5 min - choices rarely change
  });
};

// Create New Staff
export const useCreateStaff = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffData) => {
      const response = await api.post("/staff_management/staff/", staffData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store", "staff"] });
    },
  });
};

// Update Staff Member
export const useUpdateStaff = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }) => {
      const response = await api.patch(`/staff_management/staff/${id}/`, updateData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store", "staff"] });
    },
  });
};

// Delete Staff Member
export const useDeleteStaff = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/staff_management/staff/${id}/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store", "staff"] });
    },
  });
};

// Toggle Staff Status (Active/Inactive/On-Leave)
export const useToggleStaffStatus = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await api.patch(`/staff_management/staff/${id}/toggle-status/`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store", "staff"] });
    },
  });
};
