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

export const useAnalyticsSummary = (filters = {}) => {
  const { api } = useAxios();
  return useQuery({
    queryKey: ["analytics", "summary", filters],
    queryFn: async () => {
      const queryString = buildParams(filters);
      const { data } = await api.get(`analytics/reports/summary/?${queryString}`);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData,
  });
};



export const useAnalyticsCharts = (filters = {}) => {
  const { api } = useAxios();
  return useQuery({
    queryKey: ["analytics", "charts", filters],
    queryFn: async () => {
      const queryString = buildParams(filters);
      const { data } = await api.get(`analytics/reports/charts/?${queryString}`);
      return data;
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
};

export const useAnalyticsTables = (filters = {}) => {
  const { api } = useAxios();
  return useQuery({
    queryKey: ["analytics", "tables", filters],
    queryFn: async () => {
      const queryString = buildParams(filters);
      const { data } = await api.get(`analytics/reports/tables/?${queryString}`);
      return data;
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
};

export const useAnalyticsCustomerInsights = (filters = {}) => {
  const { api } = useAxios();
  return useQuery({
    queryKey: ["analytics", "customers", filters],
    queryFn: async () => {
      const queryString = buildParams(filters);
      const { data } = await api.get(`analytics/reports/customers/?${queryString}`);
      return data;
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
};
