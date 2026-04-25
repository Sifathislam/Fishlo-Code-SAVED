import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

export const useExpenseList = (filters = {}) => {
  const { api } = useAxios();
  return useQuery({
    queryKey: ["expenses", "list", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.expense_date) params.append("expense_date", filters.expense_date);
      if (filters.category) params.append("category", filters.category);
      if (filters.period && filters.period !== "CUSTOM") params.append("period", filters.period.replace("LAST_", ""));
      if (filters.start) params.append("start", filters.start);
      if (filters.end) params.append("end", filters.end);
      
      const { data } = await api.get(`store/expenses/?${params.toString()}`);
      return Array.isArray(data) ? data : data.results || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateExpense = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseData) => {
      const { data } = await api.post("store/expenses/", expenseData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "pnl"] });
    },
  });
};

export const useUpdateExpense = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...expenseData }) => {
      const { data } = await api.put(`store/expenses/${id}/`, expenseData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "pnl"] });
    },
  });
};

export const useDeleteExpense = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`store/expenses/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "pnl"] });
    },
  });
};

