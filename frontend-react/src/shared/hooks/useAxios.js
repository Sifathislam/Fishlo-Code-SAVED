import axios from "axios";
import Cookies from "js-cookie";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import useAuth from "../../hooks/useAuth";

// Flags to handle token refresh
let isRefreshing = false; // Prevent multiple simultaneous token refreshes
let refreshPromise = null; // Promise for managing token refresh

export const useAxios = () => {
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Add a request intercepter
    const requestIntercept = api.interceptors.request.use(
      (config) => {
        const authToken = Cookies.get("__Host-auth");

        const refreshToken = Cookies.get("__Host-refresh");

        if (authToken || refreshToken) {
          config.headers.Authorization = `Bearer ${authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add a response intercepter
    const responseIntercept = api.interceptors.response.use(
      (response) => response, // Pass through successful responses
      async (error) => {
        const orginalRequest = error.config; // Original request causing error
        const refreshToken = Cookies.get("__Host-refresh");
        if (
          error.response?.status === 401 &&
          !orginalRequest._retry &&
          refreshToken
        ) {
          orginalRequest._retry = true;

          // Ensure only one refresh request at a time
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = refreshAccessToken(setAuth, navigate);
          }

          try {
            const accessToken = await refreshPromise; // Wait for token refresh

            orginalRequest.headers.Authorization = `Bearer ${accessToken}`; // Retry request with new token

            return api(orginalRequest); // Retry the original request
          } catch (error) {
            console.error("Failed to refresh token:", error);
            throw error; // Propagate error if refresh fails
          } finally {
            isRefreshing = false;
            refreshPromise = null; // Reset refresh state
          }
        }
        return Promise.reject(error); // Return configured Axios instance
      }
    );
    return () => {
      api.interceptors.request.eject(requestIntercept);
      api.interceptors.response.eject(responseIntercept);
    };
  }, [setAuth, navigate]);

  return { api };
};

// Function to refresh access token
const refreshAccessToken = async (setAuth, navigate) => {
  try {
    const refreshToken = Cookies.get("__Host-refresh");
    const response = await axios.post(
      `${import.meta.env.VITE_SERVER_BASE_URL}/token/refresh/`,
      { refresh: refreshToken }
    );

    const { access, refresh } = response.data;

    // Update auth state and cookies
    setAuth((prev) => ({ ...prev, authToken: access, refreshToken: refresh }));
    document.cookie = `__Host-auth=${access}; Max-Age=${30 * 60
      }; Path=/; Secure; SameSite=Strict`;
    document.cookie = `__Host-refresh=${refresh}; Max-Age=${7 * 24 * 60 * 60
      }; Path=/; Secure; SameSite=Strict`;

    return access;
  } catch (error) {
    const options = { path: "/", secure: true, sameSite: "Strict" };
    Cookies.remove("__Host-auth", options);
    Cookies.remove("__Host-refresh", options);
    Cookies.remove("__Host-role", options);

    // Clear Django session & CSRF 
    Cookies.remove("sessionid", { path: "/" });
    Cookies.remove("csrftoken", { path: "/" });

    setAuth(null);
    navigate("/");
    throw error;
  }
};
