import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

const buildParams = (filters) => {
  const params = new URLSearchParams();
  if (filters.period && filters.period !== "CUSTOM") {
    params.append("period", filters.period.replace("LAST_", ""));
  } else {
    if (filters.start) params.append("start", filters.start);
    if (filters.end) params.append("end", filters.end);
  }
  return params.toString();
};

export const usePnLSummary = (filters = {}) => {
  const { api } = useAxios();
  return useQuery({
    queryKey: ["analytics", "pnl", "summary", filters],
    queryFn: async () => {
      const queryString = buildParams(filters);
      const { data } = await api.get(`analytics/pnl/summary/?${queryString}`);
      return data;
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
};

export const usePnLCharts = (filters = {}) => {
  const { api } = useAxios();
  return useQuery({
    queryKey: ["analytics", "pnl", "charts", filters],
    queryFn: async () => {
      const queryString = buildParams(filters);
      const { data } = await api.get(`analytics/pnl/charts/?${queryString}`);
      return data;
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
};
