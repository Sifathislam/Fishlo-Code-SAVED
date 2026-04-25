import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuth from "../hooks/useAuth";
import { useAxios } from "../shared/hooks/useAxios";

const getHeaders = () => {
  const sessionId = localStorage.getItem("fl_session_v1");
  return {
    "X-Session-ID": sessionId ? sessionId : null,
  };
};

// Fetch user addresses from the server
export const useGetAddress = () => {
  const { api } = useAxios();
  const { auth } = useAuth();
  const sessionId = localStorage.getItem("fl_session_v1");

  return useQuery({
    queryKey: ["address"],
    queryFn: async () => {
      const headers = getHeaders();
      const res = await api.get("/addresses/", { headers });
      return res?.data?.data;
    },
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!auth?.authToken || !!auth?.refreshToken || !!sessionId,
  });
};

// Set a specific address as the primary default
export const useSetDefaultAddress = () => {
  const { api } = useAxios();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (addressId) => {
      const res = await api.post(`/addresses/${addressId}/set-default/`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["address"] });
    },
    onError: (error) => {
      console.error("Failed to set default address:", error);
    },
  });
};

// Create and save a new address
export const useCreateAddress = () => {
  const { api } = useAxios();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (addressData) => {
      const res = await api.post("/addresses/", addressData);
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.data?.session_id) {
        localStorage.setItem("fl_session_v1", data.data.session_id);
      }
      // Refresh address, products, and cart data
      qc.invalidateQueries({ queryKey: ["address"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["search-products"] });
      qc.invalidateQueries({ queryKey: ["product"] });
      qc.invalidateQueries({ queryKey: ["related-products"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["recently-viewed"] });
      qc.invalidateQueries({ queryKey: ["get-product-delivery-time"] });
    },
    onError: (error) => {
      console.error("Failed to save address:", error);
    },
  });
};

// Merge guest session addresses with the logged-in user
export const useMergeAddress = () => {
  const { api } = useAxios();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const session_id = localStorage.getItem("fl_session_v1");
      if (!session_id) return;
      const res = await api.post("/addresses/merge/", { session_id });
      return res.data;
    },
    onSuccess: () => {
      // Refresh address and shopping data after merge
      qc.invalidateQueries({ queryKey: ["address"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["search-products"] });
      qc.invalidateQueries({ queryKey: ["product"] });
      qc.invalidateQueries({ queryKey: ["related-products"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["recently-viewed"] });
      qc.invalidateQueries({ queryKey: ["get-product-delivery-time"] });
    },
    onError: (error) => {
      console.error("Failed to merge addresses:", error);
    },
  });
};

// Update details of an existing address
export const useUpdateAddress = () => {
  const { api } = useAxios();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const headers = getHeaders();
      const res = await api.put(`/addresses/${id}/`, data, { headers });
      return res.data;
    },
    onSuccess: (data, variables) => {
      // Refresh specific address and all shop data
      qc.invalidateQueries({ queryKey: ["address"] });
      qc.invalidateQueries({ queryKey: ["address", variables.id] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["search-products"] });
      qc.invalidateQueries({ queryKey: ["product"] });
      qc.invalidateQueries({ queryKey: ["related-products"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["recently-viewed"] });
      qc.invalidateQueries({ queryKey: ["get-product-delivery-time"] });
    },
    onError: (error) => {
      console.error("Failed to update address:", error);
    },
  });
};

// Permanently delete an address
export const useDeleteAddress = () => {
  const { api } = useAxios();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/addresses/${id}/`);
      return res.data;
    },
    onSuccess: () => {
      // Clear address and related shop data from cache
      qc.invalidateQueries({ queryKey: ["address"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["search-products"] });
      qc.invalidateQueries({ queryKey: ["product"] });
      qc.invalidateQueries({ queryKey: ["related-products"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["recently-viewed"] });
      qc.invalidateQueries({ queryKey: ["get-product-delivery-time"] });
    },
    onError: (error) => {
      console.error("Failed to delete address:", error);
    },
  });
};


export const useGetDeliveryTime = () => {
  const { api } = useAxios();
  const { auth } = useAuth();
  // const sessionId = localStorage.getItem("fl_session_v1");

  return useQuery({
    queryKey: ["get-product-delivery-time"],
    queryFn: async () => {
      const headers = getHeaders();
      const res = await api.get("/get-delivery-time/", { headers });
      return res?.data;
    },
    // Ensure it only runs if the user has a session or is logged in
    // enabled: !!auth?.authToken || !!auth?.refreshToken || !!sessionId,
    retry: false,
    refetchOnWindowFocus: false,
  });
};
