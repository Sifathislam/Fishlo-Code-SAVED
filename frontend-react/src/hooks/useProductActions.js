import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAddToCart,
  useDecreaseQty,
  useGetCart,
  useIncreaseQty,
  useRemoveCartItem,
} from "../features/useCart";
import { useStockNotify } from "../features/useStockNotify";
import useAuth from "../hooks/useAuth";
import useStateHooks from "../shared/hooks/useStateHooks";

export const useProductActions = (product) => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { setOpenLogin } = useStateHooks();

  const [increaseCooldown, setIncreaseCooldown] = useState(false);
  const [decreaseCooldown, setDecreaseCooldown] = useState(false);
   const [weightError, setWeightError] = useState(false);
  const increaseTimer = useRef(null);
  const decreaseTimer = useRef(null);

  const startIncreaseCooldown = useCallback(() => {
    setIncreaseCooldown(true);
    if (increaseTimer.current) clearTimeout(increaseTimer.current);
    increaseTimer.current = setTimeout(() => setIncreaseCooldown(false), 20);
  }, []);

  const startDecreaseCooldown = useCallback(() => {
    setDecreaseCooldown(true);
    if (decreaseTimer.current) clearTimeout(decreaseTimer.current);
    decreaseTimer.current = setTimeout(() => setDecreaseCooldown(false), 20);
  }, []);


  const addToCartMutation = useAddToCart();
  const increaseQty = useIncreaseQty();
  const decreaseQty = useDecreaseQty();
  const removeItem = useRemoveCartItem();
  const { data: cart, error, isFetching } = useGetCart();
  const { notifyStock, isNotifying } = useStockNotify();

  const cartItems = cart?.items || [];
  const cartItem = cartItems.find((c) => c.product_id === product?.id);
  const isInCart = !!cartItem;

  const isOptimistic = cartItem?.id?.toString().startsWith("opt_");

  const handleDetailsPage = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;

      navigate(`/${product?.slug}`);
   
  };
  const maxStock = parseFloat(product?.product_max_stock || 0);
  let isMaxReached = false;

  // Calculate if max reached
  if (product?.isMasalaProduct || product?.isPackedProduct) {
    const currentQty = cartItems
      .filter((i) => i.product_id === product?.id)
      .reduce((sum, i) => sum + i.quantity, 0);

    // If we are already at or above max stock, we can't add more
    if (currentQty >= maxStock) {
      isMaxReached = true;
    }
  } else {
    // For weighted products (if used with this hook), simple qty check might not be enough
    // But MasalaItem usage suggests it's mostly for packaged/masala items or simple view
    // We'll keep simple qty check as fallback or enhance if needed for weighted
    const currentQty = cartItems
      .filter((i) => i.product_id === product?.id)
      .reduce((sum, i) => sum + i.quantity, 0);

    if (currentQty >= maxStock) {
      isMaxReached = true;
    }
  }


 

  const handleAdd = (e) => {
    e.stopPropagation();
    setWeightError(false);
    if (isMaxReached) return;

    // console.log("item", product);

    const currentCartId = localStorage.getItem("cart_id");

    // Default weight for weighted products (prefer 500g)
    const defaultWeightId =
      product?.sell_type === "WEIGHT" && product?.weights?.length > 0
        ? product.weights.find((w) => {
            const label = w.weight.toLowerCase();
            return label.includes("500") && label.includes("g");
          })?.id || product.weights[0].id
        : null;

    // Strictly ensure weight ID exists for weighted products before posting
    if (product?.sell_type === "WEIGHT" && !defaultWeightId) {
      setWeightError(true);
      setTimeout(() => setWeightError(false), 3000); // Clear error after 3s
      return;
    }

    addToCartMutation.mutate({
      product_id: product?.id,
      quantity: 1,
      cart_id: currentCartId || null,
      product_weight_id: defaultWeightId,
    });
  };

  const handleInc = (e) => {
    e.stopPropagation();
    setWeightError(false);
    if (isMaxReached || increaseCooldown || addToCartMutation.isPending || isOptimistic) return;
    startIncreaseCooldown();

    const currentCartId = localStorage.getItem("cart_id");

    // Check limit before mutating? 
    // isMaxReached is already calculated based on current cart state.
    // So if isMaxReached is true, we returned early.

    increaseQty.mutate({ id: cartItem?.id, cartId: currentCartId || null });
  };

  const handleDec = (e) => {
    e.stopPropagation();
    setWeightError(false);
    if (decreaseCooldown || addToCartMutation.isPending || isOptimistic) return;
    startDecreaseCooldown();

    const currentCartId = localStorage.getItem("cart_id");
    if (cartItem?.quantity > 1) {
      decreaseQty.mutate({ id: cartItem?.id, cartId: currentCartId || null });
    } else {
      removeItem.mutate({ id: cartItem?.id, cartId: currentCartId || null });
    }
  };

  const handleNotify = (e) => {
    e.stopPropagation();
    if (product?.isStockNotified) return;
    if (!(auth?.authToken)) {
      setOpenLogin(true);
    } else {
      notifyStock({ product: product?.id });
    }
  };

  return {
    isInCart,
    cartItem,
    isNotifying,
    isMaxReached,
    weightError,
    actions: {
      handleAdd,
      handleInc,
      handleDec,
      handleNotify,
      handleDetailsPage,
    },
    status: {
      isAdding: addToCartMutation.isPending,
      isIncreasing: increaseQty.isPending,
      isDecreasing: decreaseQty.isPending,
      isRemoving: removeItem.isPending,
      isFetching: isFetching,
      increaseCooldown,
      decreaseCooldown,
      isOptimistic,
    },
  };
};
