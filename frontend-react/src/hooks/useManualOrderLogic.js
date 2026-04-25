import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetAvailableCoupons } from "../features/useCoupon";
import { useCreateManualOrder } from "../features/useCreateManualOrder";
import { useGetCategories } from "../features/useGetCategory";
import { useManualOrderProducts } from "../features/useManualOrderProducts";
import { useGetManualReceipt } from "../features/useStoreReceipts";
import { useAxios } from "../shared/hooks/useAxios";
import useDebouncedValue from "../shared/hooks/useDebounce";
import { useCustomerSearch } from "../features/useCustomerSearch";

const STORAGE_KEY = "manual_order_state";

const loadPersistedState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

let memoryCustomerName = "";
let memoryCustomerPhone = "";

export const useManualOrderLogic = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();
  const getManualReceiptMutation = useGetManualReceipt();
  const saved = loadPersistedState();

  // --- State Management (initialized from localStorage) ---
  const [customerName, _setCustomerName] = useState(memoryCustomerName);
  const [customerPhone, _setCustomerPhone] = useState(memoryCustomerPhone);

  const setCustomerName = (val) => {
    memoryCustomerName = val instanceof Function ? val(customerName) : val;
    _setCustomerName(val);
  };

  const setCustomerPhone = (val) => {
    memoryCustomerPhone = val instanceof Function ? val(customerPhone) : val;
    _setCustomerPhone(val);
  };
  const [orderType, setOrderType] = useState(saved?.orderType ?? "WALKIN");
  const [deliveryAddress, setDeliveryAddress] = useState(saved?.deliveryAddress ?? null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [cart, setCart] = useState(saved?.cart ?? []);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState(saved?.paymentMethod ?? "cash");

  // Discount State
  const [discountMode, setDiscountMode] = useState(saved?.discountMode ?? "MANUAL");
  const [manualDiscount, setManualDiscount] = useState(saved?.manualDiscount ?? 0);
  const [couponCode, setCouponCode] = useState(saved?.couponCode ?? "");
  const [appliedCoupon, setAppliedCoupon] = useState(saved?.appliedCoupon ?? null);
  const [couponError, setCouponError] = useState("");

  // UI Helpers
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Autocomplete via Tanstack
  const debouncedPhone = useDebouncedValue(customerPhone, 300);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);

  const { data: searchResults, isLoading: isPhoneSearchLoading } = useCustomerSearch(debouncedPhone);

  const currentRawPhone = (customerPhone || "").replace(/\D/g, "");
  
  // Instantly locally filter cached results so UI doesn't lag 300ms
  const baseSuggestions = searchResults || [];
  const filteredSuggestions = currentRawPhone 
        ? baseSuggestions.filter(s => s.phone.includes(currentRawPhone)) 
        : baseSuggestions;

  const phoneSuggestions = (showPhoneSuggestions && currentRawPhone.length >= 3) ? filteredSuggestions : [];

  const handleSelectPhoneSuggestion = (suggestion) => {
    setCustomerPhone(suggestion.phone);
    if (suggestion.name) {
      setCustomerName(suggestion.name);
    }
    setShowPhoneSuggestions(false);
  };

  // Modal State
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [selectedProductForOption, setSelectedProductForOption] =
    useState(null);

  // Receipt State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Order Error State
  const [orderError, setOrderError] = useState("");
  // Cart/Stock Error State
  const [cartError, setCartError] = useState("");

  // --- Persist state to localStorage on every change ---
  useEffect(() => {
    const stateToSave = {
      cart,
      orderType,
      deliveryAddress,
      discountMode,
      manualDiscount,
      couponCode,
      appliedCoupon,
      paymentMethod,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // localStorage full or unavailable — silently ignore
    }
  }, [cart, orderType, deliveryAddress, discountMode, manualDiscount, couponCode, appliedCoupon, paymentMethod]);

  // --- Data Fetching ---
  const { data: categoriesData, isLoading: isCategoriesLoading } =
    useGetCategories();
  const { data: couponsData } = useGetAvailableCoupons();

  const { data: productsData, isLoading } = useManualOrderProducts({
    search: debouncedSearch,
    category: selectedCategory === "All" ? "" : selectedCategory,
  });

  const createOrderMutation = useCreateManualOrder();

  // Helper to get products list
  const productList = useMemo(() => {
    if (!productsData) return [];
    return Array.isArray(productsData)
      ? productsData
      : productsData.results || [];
  }, [productsData]);

  // Categories from API
  const categoriesList = useMemo(() => {
    const list = categoriesData || [];
    return [{ id: "all", name: "All", slug: "All" }, ...list];
  }, [categoriesData]);

  // --- Handlers ---

  // Stock Validation Helper
  const checkStockLimit = (product, additionalQty = 1, currentCart = cart, specificWeightObj = null) => {
    if (!product) return { allowed: false, message: "Invalid product" };

    const maxStock = parseFloat(product.product_max_stock || 0);

    // Check if out of stock
    if (product.isOutOfStock) return { allowed: false, message: "Product is out of stock" };

    // Check limit if maxStock is set
    if (maxStock <= 0) return { allowed: false, message: "Stock limit reached" };


    const isWeighted = product.is_weighted_product || (product.weights && product.weights.length > 0);

    const getUnitWeight = (weightStr) => {
      const s = weightStr?.toLowerCase() || "";
      if (s.includes("kg")) {
        return parseFloat(s.replace("kg", "").trim()) || 0;
      } else if (s.includes("g")) {
        return (parseFloat(s.replace("g", "").trim()) || 0) / 1000;
      }
      return 0;
    };


    // Calculate Predicted Total Stock Consumption

    let predictedUsage = 0;

    if (isWeighted) {
      // Existing Usage
      const existingUsage = currentCart
        .filter(i => i.id === product.id)
        .reduce((sum, i) => {
          const wStr = i.selectedWeight || i.unit || "";
          return sum + (i.quantity * getUnitWeight(wStr));
        }, 0);

      let newUsage = 0;
      if (specificWeightObj) {
        // Adding a new item or increasing a specific weight variant
        newUsage = additionalQty * getUnitWeight(specificWeightObj.weight || "");
      }

      predictedUsage = existingUsage + newUsage;

    } else {
      // Packed Product
      const existingQty = currentCart
        .filter(i => i.id === product.id)
        .reduce((sum, i) => sum + i.quantity, 0);

      predictedUsage = existingQty + additionalQty;
    }

    // Floating point margin
    if (predictedUsage > maxStock + 0.001) {
      const unit = isWeighted ? "kg" : "items";
      return { allowed: false, message: `Stock limit reached (${maxStock} ${unit})` };
    }

    return { allowed: true, message: "" };
  };

  // Helper to re-check specific item in cart for updateQuantity
  const checkCartItemLimit = (cartItem, delta) => {
    const product = {
      id: cartItem.id,
      product_max_stock: cartItem.product_max_stock,
      is_weighted_product: cartItem.is_weighted_product || (cartItem.selectedWeight && cartItem.selectedWeight !== "kg"), // infer
      weights: [], // Not needed if we parse weight string directly
      isOutOfStock: false
    };

    // Calculate current usage in cart
    const getUnitWeight = (weightStr) => {
      const s = weightStr?.toLowerCase() || "";
      if (s.includes("kg")) {
        return parseFloat(s.replace("kg", "").trim()) || 0;
      } else if (s.includes("g")) {
        return (parseFloat(s.replace("g", "").trim()) || 0) / 1000;
      }
      return 0;
    };

    const itemWeight = getUnitWeight(cartItem.selectedWeight || cartItem.unit || "");
    const isWeighted = itemWeight > 0; // If we detected a valid weight, treat as weighted logic

    const maxStock = parseFloat(cartItem.product_max_stock || 0);
    if (maxStock <= 0) return { allowed: false }; // Should limit if 0

    let currentUsage = 0;

    if (isWeighted) {
      // Sum all items of this product ID
      currentUsage = cart
        .filter(i => i.id === cartItem.id)
        .reduce((sum, i) => sum + (i.quantity * getUnitWeight(i.selectedWeight || i.unit)), 0);

      // We are changing THIS item's quantity by delta
      // predicted = currentUsage + (delta * itemWeight)
      if (currentUsage + (delta * itemWeight) > maxStock + 0.001) {
        return { allowed: false, message: `Max ${maxStock}kg limit reached` };
      }

    } else {
      // Packed
      currentUsage = cart
        .filter(i => i.id === cartItem.id)
        .reduce((sum, i) => sum + i.quantity, 0);

      if (currentUsage + delta > maxStock) {
        return { allowed: false, message: `Max ${maxStock} items limit reached` };
      }
    }

    return { allowed: true };
  };


  // Coupon Handler
  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (!couponsData || !couponsData.discounts) {
      setCouponError("Unable to validate coupon at this time");
      return;
    }

    const coupon = couponsData.discounts.find((c) => c.code === code);

    if (coupon) {
      setAppliedCoupon({
        code: coupon.code,
        type: coupon.discount_type === "PERCENTAGE" ? "PERCENT" : "FIXED",
        value:
          coupon.discount_type === "PERCENTAGE"
            ? coupon.discount_percentage
            : coupon.discount_fixed_amount,
      });
      setCouponError("");
      setManualDiscount(0); // Exclusive: Reset manual discount
    } else {
      setCouponError("Invalid coupon code");
      setAppliedCoupon(null);
    }
  };

  const clearCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  // Cart Handlers
  const initiateAddToCart = (product) => {
    if (product.isOutOfStock) return;

    // Reset error when starting new add
    setCartError("");

    const hasCuts = product.cuts && product.cuts.length > 0;
    const hasWeights = product.weights && product.weights.length > 0;

    if (hasCuts || hasWeights) {
      setSelectedProductForOption(product);
      setShowOptionModal(true);
    } else {
      // Direct add (Packed product usually)
      const check = checkStockLimit(product, 1, cart, null);
      if (!check.allowed) {
        setCartError(check.message);
        // Optional: Clear error after 3 seconds
        setTimeout(() => setCartError(""), 3000);
        return;
      }
      addToCart({ product, cut: null, weight: null, retailPrice: parseFloat(product.display_price || 0) });
    }
  };

  const addToCart = ({ product, cut, weight, retailPrice }) => {

    // Double check limit here (especially for Modal flow)
    // If coming from Modal, `weight` is the selected weight object
    const check = checkStockLimit(product, 1, cart, weight);
    if (!check.allowed) {
      setCartError(check.message);
      setTimeout(() => setCartError(""), 3000);
      return;
    }

    // Default values if not provided
    const selectedCut = cut || { name: "Standard", price: 0, id: null };
    const selectedWeight = weight; // can be null

    // Unique Cart Item ID
    const weightId = selectedWeight ? selectedWeight.id : "std";
    const cartItemId = `${product.id}-${selectedCut.name}-${weightId}-${retailPrice}`; // Include retailPrice in ID to differentiate price overrides

    let unitPriceBase = retailPrice !== undefined ? retailPrice : parseFloat(product.display_price || 0);
    const cutPriceCheck = parseFloat(selectedCut.price || 0);

    let baseWeightPrice = unitPriceBase;
    let weightLabel = "";
    if (selectedWeight) {
      const weightVal = parseFloat(selectedWeight.weight_kg || 0);
      if (weightVal > 0) {
        baseWeightPrice = baseWeightPrice * weightVal;
      }
      weightLabel = selectedWeight.weight; // e.g. "500g"
    } else {
      weightLabel = product.unit || "kg"; // Fallback to product unit
    }

    // Final price for this item (Base weight price + cut price flat)
    const finalItemPrice = baseWeightPrice + cutPriceCheck;

    const existing = cart.find((item) => item.cartItemId === cartItemId);

    if (existing) {
      setCart(
        cart.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          ...product,
          cartItemId,
          // Store raw objects needed for API
          rawCut: selectedCut,
          rawWeight: selectedWeight,

          selectedCut: selectedCut.name,
          cutPrice: cutPriceCheck,
          selectedWeight: weightLabel,
          baseWeightPrice: baseWeightPrice,
          retailPricePerKg: unitPriceBase, // Store the custom retail price
          // We store the calculated price for this specific SKU (Product + Cut + Weight)
          price: finalItemPrice,
          quantity: 1,
        },
      ]);
    }
    setShowOptionModal(false);
    setSelectedProductForOption(null);
    setCartError("");
  };

  const updateQuantity = (cartItemId, delta) => {
    if (delta > 0) {
      const item = cart.find(i => i.cartItemId === cartItemId);
      if (item) {
        const check = checkCartItemLimit(item, delta);
        if (!check.allowed) {
          setCartError(check.message);
          setTimeout(() => setCartError(""), 3000);
          return;
        }
      }
    }

    setCartError("");
    setCart(
      cart.map((item) => {
        if (item.cartItemId === cartItemId) {
          return { ...item, quantity: Math.max(1, item.quantity + delta) };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (cartItemId) =>
    setCart(cart.filter((item) => item.cartItemId !== cartItemId));

  // Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0,
  );

  let discountAmount = 0;
  if (discountMode === "MANUAL") {
    discountAmount = manualDiscount;
  } else if (discountMode === "COUPON" && appliedCoupon) {
    if (appliedCoupon.type === "PERCENT") {
      discountAmount = parseFloat(((subtotal * appliedCoupon.value) / 100).toFixed(2));
    } else {
      discountAmount = appliedCoupon.value;
    }
  }

  const rawTotal = Math.max(0, subtotal - discountAmount);
  // Ensure we are working with 2 decimal places for rawTotal to avoid floating point weirdness
  const preciseRawTotal = Math.round(rawTotal * 100) / 100;

  const total = Math.floor(preciseRawTotal);
  // Show the decimal part as the rounding off value (e.g. 215.6 -> 215 total, 0.6 rounding off)
  const roundOffAmount = parseFloat(Math.abs(total - preciseRawTotal).toFixed(2));


  // Order Placement
  const handlePlaceOrder = () => {
    setOrderError(""); // Clear any previous error on retry

    // Normalize phone: strip spaces, +91, leading zeros → pure 10-digit
    let cleanPhone = customerPhone.replace(/[\s\-\(\)]/g, ""); // remove spaces, dashes, parens
    cleanPhone = cleanPhone.replace(/^\+91/, "");               // strip +91 prefix
    cleanPhone = cleanPhone.replace(/^0+/, "");                 // strip leading zeros

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setOrderError("Please enter a valid 10-digit Indian phone number (starts with 6-9).");
      return;
    }
    // Update state with cleaned phone so backend receives normalized value
    setCustomerPhone(cleanPhone);

    const purchase_type =
      orderType === "DELIVERY" ? "home_delivery" : "walk_in_customer";

    const discount_type = discountMode === "MANUAL" ? "manual" : "coupon";
    // User requested specifically to send 0 in discount_value if coupon is applied
    const discount_value = discountMode === "MANUAL" ? discountAmount : 0;
    const discount_code =
      discountMode === "COUPON" ? appliedCoupon?.code || "" : "";

    let delivery_address = null;
    if (purchase_type === "home_delivery" && deliveryAddress) {
      delivery_address = {
        flat_no: deliveryAddress.house_details || "",
        street: deliveryAddress.address_line_2 || "",
        city: deliveryAddress.city || "",
        pincode: deliveryAddress.postal_code || "",
        land_mark: deliveryAddress.landmark || "",
        state: "State",
      };
    }

    const productMap = new Map();

    cart.forEach((item) => {
      if (!productMap.has(item.id)) {
        productMap.set(item.id, {
          id: item.id,
          weight_and_cuts: [],
        });
      }

      const entry = productMap.get(item.id);

      let weight_id = item.rawWeight?.id || null;
      let custom_weight = null;

      if (weight_id === "custom") {
        weight_id = null;
        custom_weight = item.rawWeight?.weight_kg || null;
      }

      entry.weight_and_cuts.push({
        cut_id: item.rawCut?.id || null,
        weight_id: weight_id,
        custom_weight: custom_weight,
        quantity: item.quantity,
        retail_price_per_kg: item.retailPricePerKg || (item.baseWeightPrice / (item.rawWeight?.weight_kg || 1) || item.price || 0), // fallback if needed
      });
    });

    const productsPayload = Array.from(productMap.values());

    const payload = {
      purchase_type,
      customer_name: customerName.trim() || "Walk In Customer", // Default if empty
      customer_phone: parseInt(customerPhone) || 0, // Ensure number
      discount_type,
      discount_value,
      discount_code, // Add discount_code to payload
      delivery_address,
      payment_method: paymentMethod,
      products: productsPayload,
    };

    // Call API
    createOrderMutation.mutate(payload, {
      onSuccess: async (data) => {
        // Show Receipt Logic
        const orderNumber = data.data?.order_number || "N/A";

        let fetchedReceiptData = null;
        try {
          if (orderNumber !== "N/A") {
            const receiptRes = await getManualReceiptMutation.mutateAsync({ orderNumber });
            if (receiptRes?.success) {
              fetchedReceiptData = {
                customer: receiptRes.customer_receipt || receiptRes.receipt || "",
                staff: receiptRes.staff_receipt || ""
              };
            }
          }
        } catch (err) {
          console.error("Failed to fetch receipt data", err);
        }

        setReceiptData(fetchedReceiptData);
        setShowPreviewModal(false);
        setShowReceiptModal(true);

        // Reset Cart & Input (but keep order details for receipt)
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        memoryCustomerName = "";
        memoryCustomerPhone = "";
        setDeliveryAddress(null);
        setManualDiscount(0);
        setDiscountMode("MANUAL");
        setOrderError("");
        setPaymentMethod("cash");
        setSearchQuery("");
        setSelectedCategory("All");
        setCouponCode("");
        setAppliedCoupon(null);

        // Invalidate store order queries so the order list refreshes instantly
        queryClient.invalidateQueries({ queryKey: ["store"] });
      },
      onError: (error) => {
        console.error(error);
        // Parse backend error response for display
        const responseData = error?.response?.data;
        let message = "Failed to place order. Please try again.";
        if (responseData) {
          if (typeof responseData === "string") {
            message = responseData;
          } else if (responseData.detail) {
            message = responseData.detail;
          } else if (responseData.message) {
            message = responseData.message;
          } else if (responseData.error) {
            message = responseData.error;
          } else {
            // Collect all field errors
            const fieldErrors = Object.entries(responseData)
              .map(([key, val]) => {
                const errText = Array.isArray(val) ? val.join(", ") : String(val);
                return `${key}: ${errText}`;
              })
              .join(" | ");
            if (fieldErrors) message = fieldErrors;
          }
        } else if (error?.message) {
          message = error.message;
        }
        setOrderError(message);
      },
    });
  };

  const handleCloseReceipt = () => {
    setShowReceiptModal(false);
    setReceiptData(null);
    // Fully clear persisted state after order is complete
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const clearOrderError = () => setOrderError("");


  return {
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    orderType,
    setOrderType,
    deliveryAddress,
    setDeliveryAddress,
    showAddressModal,
    setShowAddressModal,
    searchQuery,
    setSearchQuery,
    cart,
    discountMode,
    setDiscountMode,
    manualDiscount,
    setManualDiscount,
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponError,
    showMobileCart,
    setShowMobileCart,
    showPreviewModal,
    setShowPreviewModal,
    selectedCategory,
    setSelectedCategory,
    showOptionModal,
    setShowOptionModal,
    selectedProductForOption,
    setSelectedProductForOption,
    showReceiptModal,
    isLoading,
    isCategoriesLoading,
    productList,
    categoriesList,
    handleApplyCoupon,
    clearCoupon,
    initiateAddToCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    subtotal,
    total,
    handlePlaceOrder,
    handleCloseReceipt,
    createOrderMutation,
    discountAmount,
    roundOffAmount,
    orderError,
    clearOrderError,
    paymentMethod,
    setPaymentMethod,
    receiptData,
    cartError, // Expose
    checkStockLimit, // Expose for UI checks
    checkCartItemLimit, // Expose if needed

    // Autocomplete exports
    phoneSuggestions,
    isPhoneSearchLoading,
    setShowPhoneSuggestions,
    handleSelectPhoneSuggestion,
  };
};
