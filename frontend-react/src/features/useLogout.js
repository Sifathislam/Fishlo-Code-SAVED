import { useMutation, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useAxios } from "../shared/hooks/useAxios";

export const useLogout = () => {
  const { api } = useAxios();
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const refresh = Cookies.get("__Host-refresh");
      if (!refresh) return null;

      try {
        return await api.post("logout/", { refresh });
      } catch (error) {
        console.warn("Logout failed (token likely invalid):", error);
        return null;
      }
    },
    onSettled: (_data, _error, variables) => {
      const cookieOptions = { path: "/", secure: true, sameSite: "Strict" };
      Cookies.remove("__Host-auth", cookieOptions);
      Cookies.remove("__Host-refresh", cookieOptions);
      Cookies.remove("__Host-role", cookieOptions);

      // Clear Django session & CSRF
      Cookies.remove("sessionid", { path: "/" });
      Cookies.remove("csrftoken", { path: "/" });

      setAuth({ authToken: null, refreshToken: null, role: null }); // Clear global auth state

      //  Invalidate specific active queries so they refetch smoothly in the background
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          const keysToInvalidate = [
            "product",
            "masala",
            "get-product-delivery-time",
            "address",
            "get-product-delivery-time",
            "cart",
          ];
          return (
            typeof key === "string" &&
            keysToInvalidate.some((pK) => key.includes(pK))
          );
        },
      });

      const redirectTo = variables?.redirectTo || "/";
      navigate(redirectTo);
    },
  });
};
