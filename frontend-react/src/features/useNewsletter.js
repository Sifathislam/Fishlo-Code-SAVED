import { useMutation } from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";


export const useSubscribeNewsletter = () => {
  const { api } = useAxios();

  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/subscribe/", data);
      return response.data;
    },
  });
};
