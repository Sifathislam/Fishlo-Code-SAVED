import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAxios } from "../shared/hooks/useAxios";

/**
 * This object manages our cache keys in one place.
 * By organizing keys like this, we can easily tell the library to refresh
 * the entire cart or just a specific version tied to an address.
 */
const cartKeys = {
  all: ["cart"],
  detail: (addressId) => ["cart", { addressId: addressId ?? null }],
};

/**
 * Module-level counter to track how many cart mutations (increase, decrease, remove)
 * are currently in-flight. We only refetch from the server when ALL pending mutations
 * have settled, so rapid clicks don't cause intermediate refetches that overwrite
 * our optimistic updates.
 */
let pendingCartMutations = 0;

const onCartMutationStart = () => {
  pendingCartMutations++;
};

const onCartMutationSettled = (qc) => {
  pendingCartMutations--;
  if (pendingCartMutations === 0) {
    qc.invalidateQueries({ queryKey: cartKeys.all });
  }
};

/* ============================
   FETCHING THE CART
=============================== */
export const useGetCart = (addressId = null) => {
  const { api } = useAxios();

  return useQuery({
    queryKey: cartKeys.detail(addressId),
    queryFn: async () => {
      const cartId = localStorage.getItem("cart_id");
      const session_id = localStorage.getItem("fl_session_v1");

      const res = await api.get("/cart/", {
        params: addressId ? { address_id: addressId } : {},
        headers: {
          "X-Cart-ID": cartId || null,
          "X-Session-ID": session_id || "",
        },
      });
      return res?.data?.data;
    },
    /**
     * We use this helper to keep the current cart data on screen while
     * the new data for a different address is being fetched.
     * This prevents the UI from jumping or showing a blank state.
     */
    placeholderData: keepPreviousData,
  });
};
/* ============================
   ADDING ITEMS
=============================== */
export const useAddToCart = (addressId = null) => {
  const { api } = useAxios();
  const qc = useQueryClient();
  const currentKey = cartKeys.detail(addressId);

  return useMutation({
    mutationFn: (body) => api.post("cart/add/", body),

    onMutate: async (body) => {
      /**
       * Before making changes, we stop any active background refreshes
       * so they don't overwrite our local "instant" update.
       */
      await qc.cancelQueries({ queryKey: cartKeys.all });

      // We save the current cart state so we can restore it if the server request fails.
      const prev = qc.getQueryData(currentKey);

      // We manually update the local cache to show the new item immediately.
      qc.setQueryData(currentKey, (old) => {
        if (!old) return old;

        // Match by product_id, weight, AND cut to correctly identify the exact variant
        const exists = old.items?.find((i) => {
          const sameProduct = i.product_id === body.product_id;
          const sameWeight = i.product_weight_id === body.product_weight_id;
          const itemCutId = i.selected_cuts?.[0]?.id;
          const sameCut = body.cut_ids
            ? itemCutId === body.cut_ids
            : !itemCutId;
          return sameProduct && sameWeight && sameCut;
        });

        if (exists) {
          return {
            ...old,
            items: old.items.map((i) =>
              i.id === exists.id
                ? { ...i, quantity: i.quantity + body.quantity }
                : i
            ),
          };
        } else {
          return {
            ...old,
            items: [
              ...(old?.items ?? []),
              {
                id: "opt_" + Date.now(),
                product_id: body.product_id,
                product_weight_id: body.product_weight_id,
                selected_cuts: body.cut_ids
                  ? [{ id: body.cut_ids }]
                  : [],
                product_name: "Adding to cart...",
                quantity: body.quantity,
                unit_price: 0,
                total: 0,
              },
            ],
          };
        }
      });

      return { prev };
    },

    // If the network request fails, we roll back to the original cart data.
    onError: (_e, _v, ctx) => {
      qc.setQueryData(currentKey, ctx?.prev);
    },

    onSuccess: (res) => {
      const data = res.data.data;
      // If the backend creates a new ID for the cart, we save it for future requests.
      if (data?.cart_id) localStorage.setItem("cart_id", data.cart_id);
    },

    onSettled: () => {
      /**
       * Whether the update worked or failed, we refresh the data from the server
       * to make sure the UI is perfectly in sync with the database.
       */
      qc.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};

/* ============================
   CHANGING QUANTITIES (INCREASE)
=============================== */
export const useIncreaseQty = (addressId = null) => {
  const { api } = useAxios();
  const qc = useQueryClient();
  const currentKey = cartKeys.detail(addressId);

  return useMutation({
    mutationFn: ({ id, cartId }) => {
      return api.post(`cart/item/increase/${id}/`, { cart_id: cartId || null });
    },

    onMutate: async ({ id }) => {
      onCartMutationStart();
      await qc.cancelQueries({ queryKey: cartKeys.all });
      const prev = qc.getQueryData(currentKey);

      // We increase the quantity locally right away for a snappy feel.
      qc.setQueryData(currentKey, (old) => ({
        ...old,
        items: old?.items?.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      }));

      return { prev };
    },

    onError: (_e, _v, ctx) => qc.setQueryData(currentKey, ctx?.prev),
    onSettled: () => onCartMutationSettled(qc),
  });
};

/* ============================
   CHANGING QUANTITIES (DECREASE)
=============================== */
export const useDecreaseQty = (addressId = null) => {
  const { api } = useAxios();
  const qc = useQueryClient();
  const currentKey = cartKeys.detail(addressId);

  return useMutation({
    mutationFn: ({ id, cartId }) => {
      return api.post(`cart/item/decrease/${id}/`, { cart_id: cartId || null });
    },

    onMutate: async ({ id }) => {
      onCartMutationStart();
      await qc.cancelQueries({ queryKey: cartKeys.all });
      const prev = qc.getQueryData(currentKey);

      // We lower the quantity locally, ensuring we don't go below 1.
      qc.setQueryData(currentKey, (old) => ({
        ...old,
        items: old?.items?.map((i) =>
          i.id === id && i.quantity > 1 ? { ...i, quantity: i.quantity - 1 } : i
        ),
      }));

      return { prev };
    },

    onError: (_e, _v, ctx) => qc.setQueryData(currentKey, ctx?.prev),
    onSettled: () => onCartMutationSettled(qc),
  });
};

/* ============================
   DELETING ITEMS
=============================== */
export const useRemoveCartItem = (addressId = null) => {
  const { api } = useAxios();
  const qc = useQueryClient();
  const currentKey = cartKeys.detail(addressId);

  return useMutation({
    mutationFn: ({ id, cartId }) => {
      return api.post(`cart/item/remove/${id}/`, { cart_id: cartId || null });
    },

    onMutate: async ({ id }) => {
      onCartMutationStart();
      await qc.cancelQueries({ queryKey: cartKeys.all });
      const prev = qc.getQueryData(currentKey);

      // Optimistically hide the item and recalculate totals
      qc.setQueryData(currentKey, (old) => {
        if (!old || !old.items) return old;

        const itemToRemove = old.items.find(i => i.id === id);
        if (!itemToRemove) return old;

        const updatedItems = old.items.filter(i => i.id !== id);

        // Recalculate totals
        const itemTotal = parseFloat(itemToRemove.total || 0);
        const itemTax = parseFloat(itemToRemove.unit_tax_amount || 0) * itemToRemove.quantity;

        const newSubtotal = Math.max(0, (parseFloat(old.subtotal || 0) - itemTotal));
        const newTotalTax = Math.max(0, (parseFloat(old.total_tax || 0) - itemTax));

        return {
          ...old,
          items: updatedItems,
          items_count: Math.max(0, (old.items_count || 1) - 1),
          subtotal: parseFloat(newSubtotal.toFixed(2)),
          total_tax: parseFloat(newTotalTax.toFixed(2))
        };
      });

      return { prev };
    },

    onError: (_e, _v, ctx) => qc.setQueryData(currentKey, ctx?.prev),
    onSettled: () => onCartMutationSettled(qc),
  });
};

/* ============================
   UTILITY: CLEARING AND MERGING
=============================== */
export const useClearCart = () => {
  const { api } = useAxios();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => api.delete("cart/clear/"),
    onSuccess: () => {
      /**
       * After the cart is cleared on the server, we tell the cache
       * to refresh all cart-related data.
       */
      qc.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};

export const useMergeCart = () => {
  const { api } = useAxios();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (cart_id) => api.post("cart/merge/", { cart_id }),
    onSuccess: () => {
      // Trigger a full refresh to show the final state after merging.
      qc.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};
