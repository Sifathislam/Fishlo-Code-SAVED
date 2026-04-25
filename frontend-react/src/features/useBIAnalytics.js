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

export const useBISummary = (filters = {}) => {
  const { api } = useAxios();
  return useQuery({
    queryKey: ["bi", "summary", filters],
    queryFn: async () => {
      const queryString = buildParams(filters);
      const { data } = await api.get(`analytics/bi/summary/?${queryString}`);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData,
  });
};

export const useBICharts = (filters = {}) => {
  const { api } = useAxios();
  return useQuery({
    queryKey: ["bi", "charts", filters],
    queryFn: async () => {
      const queryString = buildParams(filters);
      const { data } = await api.get(`analytics/bi/charts/?${queryString}`);
      return data;
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
};

export const useBICustomers = (filters = {}) => {
  const { api } = useAxios();
  return useQuery({
    queryKey: ["bi", "customers", filters],
    queryFn: async () => {
      const queryString = buildParams(filters);
      const { data } = await api.get(`analytics/bi/customers/?${queryString}`);
      return data;
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
};

export const useBIRiders = (filters = {}) => {
  const { api } = useAxios();
  return useQuery({
    queryKey: ["bi", "riders", filters],
    queryFn: async () => {
      const queryString = buildParams(filters);
      const { data } = await api.get(`analytics/bi/riders/?${queryString}`);
      return data;
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
};
