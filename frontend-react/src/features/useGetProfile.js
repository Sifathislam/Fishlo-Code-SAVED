import { useQuery } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";
import Cookies from "js-cookie";
import useAuth from "../hooks/useAuth";


export const useGetProfile = () => {
  const {api} = useAxios()
  const { auth } = useAuth(); // Get the token from global state
  
  // Use the token from state, not directly from cookies
  const token = auth?.authToken;
  return useQuery({
    queryKey: ["user-profile", token],

    queryFn: async () => {
      const response = await api.get("profile/");
      return response.data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: !!token,
  });
};

export const useGetStoreManagerInfo = () => {
  const { api } = useAxios();
  const { auth } = useAuth();
  
  const token = auth?.authToken;
  return useQuery({
    queryKey: ["store-manager-info", token],
    queryFn: async () => {
      const response = await api.get("store-manager/info/");
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: !!token,
  });
};
