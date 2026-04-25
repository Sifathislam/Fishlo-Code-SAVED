import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetAvailableCoupons } from "../features/useCoupon";
import { useCreateManualOrder } from "../features/useCreateManualOrder";
import { useGetManualReceipt } from "../features/useStoreReceipts";
import { useAxios } from "../shared/hooks/useAxios";
import useDebouncedValue from "../shared/hooks/useDebounce";
import { useCustomerSearch } from "../features/useCustomerSearch";

const STORAGE_KEY = "custom_order_state";

const loadPersistedState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

let memoryCustomCustomerName = "";
let memoryCustomCustomerPhone = "";

export const useCustomOrderLogic = () => {
  const { api } = useAxios();
  const queryClient = useQueryClient();
  const getManualReceiptMutation = useGetManualReceipt();
  const saved = loadPersistedState();

  // --- Customer State ---
  const [customerName, _setCustomerName] = useState(memoryCustomCustomerName);
  const [customerPhone, _setCustomerPhone] = useState(memoryCustomCustomerPhone);

  const setCustomerName = (val) => {
    memoryCustomCustomerName = val instanceof Function ? val(customerName) : val;
    _setCustomerName(val);
  };

  const setCustomerPhone = (val) => {
    memoryCustomCustomerPhone = val instanceof Function ? val(customerPhone) : val;
    _setCustomerPhone(val);
  };
  const [orderType, setOrderType] = useState(saved?.orderType ?? "WALKIN");
  const [deliveryAddress, setDeliveryAddress] = useState(saved?.deliveryAddress ?? null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // --- Custom Product Input Form State ---
  const [itemName, setItemName] = useState("");
  const [itemWeight, setItemWeight] = useState(""); // in kg
  const [itemPricePerKg, setItemPricePerKg] = useState("");
  const [itemCutPrice, setItemCutPrice] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNote, setItemNote] = useState("");
  const [sellType, setSellType] = useState("WEIGHT"); // 'WEIGHT' or 'PIECE'

  // --- Cart State ---
  const [cart, setCart] = useState(saved?.cart ?? []);

  // --- Payment State ---
  const [paymentMethod, setPaymentMethod] = useState(saved?.paymentMethod ?? "cash");

  // --- Discount State ---
  const [discountMode, setDiscountMode] = useState(saved?.discountMode ?? "MANUAL");
  const [manualDiscount, setManualDiscount] = useState(saved?.manualDiscount ?? 0);
  const [couponCode, setCouponCode] = useState(saved?.couponCode ?? "");
  const [appliedCoupon, setAppliedCoupon] = useState(saved?.appliedCoupon ?? null);
  const [couponError, setCouponError] = useState("");

  // --- UI Helpers ---
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [orderError, setOrderError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Autocomplete via Tanstack
  const debouncedPhone = useDebouncedValue(customerPhone, 300);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);

  const { data: searchResults, isLoading: isPhoneSearchLoading } = useCustomerSearch(debouncedPhone);

  const cleanPhone = (debouncedPhone || "").replace(/\D/g, "");
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

  // --- Persist state ---
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
      // ignore
    }
  }, [cart, orderType, deliveryAddress, discountMode, manualDiscount, couponCode, appliedCoupon, paymentMethod]);

  // --- Data Fetching ---
  const { data: couponsData } = useGetAvailableCoupons();
  const createOrderMutation = useCreateManualOrder();

  // --- Cart Handlers ---
  const addToCart = () => {
    const isWeighted = sellType === "WEIGHT";
    const weight = isWeighted ? (parseFloat(itemWeight) || 0) : 0;
    const pieces = !isWeighted ? (parseInt(itemQuantity) || 1) : 0;
    const pricePerUnit = parseFloat(itemPricePerKg) || 0;
    const cutPrice = isWeighted ? (parseFloat(itemCutPrice) || 0) : 0;
    const quantity = parseInt(itemQuantity) || 1;

    // Total price calculation
    // For WEIGHT products, we sell by the 'bag' so totalPrice is weight * pricePerUnit.
    // For PIECE products, a unit is a single piece, so totalPrice is simply pricePerUnit.
    const totalPrice = isWeighted ? (weight * pricePerUnit) : pricePerUnit;

    const newItem = {
      cartItemId: Date.now().toString(),
      type: "custom",
      sell_type: sellType,
      name: itemName,
      weight: weight,
      pieces: pieces,
      price_per_kg: isWeighted ? pricePerUnit : 0,
      price_per_piece: !isWeighted ? pricePerUnit : 0,
      cut_price: cutPrice,
      quantity: quantity, // Now we use the actual quantity from the form for both WEIGHT and PIECE
      total_price: totalPrice,
      note: isWeighted ? itemNote : "",
      // Internal fields for rendering (CartSection expects these)
      price: totalPrice + (isWeighted ? cutPrice : 0),
      cutPrice: cutPrice,
      baseWeightPrice: isWeighted ? totalPrice : 0,
      rawWeight: isWeighted, // Triggers weight display in CartSection if true
      selectedWeight: isWeighted ? `${weight} kg` : `${quantity} pcs`,
    };

    setCart([...cart, newItem]);

    // Clear form
    setItemName("");
    setItemWeight("");
    setItemPricePerKg("");
    setItemCutPrice("");
    setItemQuantity(1);
    setItemNote("");
    setSellType("WEIGHT");
  };

  const removeFromCart = (cartItemId) => {
    setCart(cart.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId, delta) => {
    setCart(
      cart.map((item) => {
        if (item.cartItemId === cartItemId) {
          const newQty = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity: newQty,
            pieces: item.sell_type === 'WEIGHT' ? 0 : newQty // Keeping pieces in sync for PIECE items
          };
        }
        return item;
      })
    );
  };

  // --- Discount Handlers ---
  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code || !couponsData || !couponsData.discounts) return;

    const coupon = couponsData.discounts.find((c) => c.code === code);
    if (coupon) {
      setAppliedCoupon({
        code: coupon.code,
        type: coupon.discount_type === "PERCENTAGE" ? "PERCENT" : "FIXED",
        value: coupon.discount_type === "PERCENTAGE" ? coupon.discount_percentage : coupon.discount_fixed_amount,
      });
      setCouponError("");
      setManualDiscount(0);
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

  // --- Calculations ---
  const subtotal = cart.reduce((sum, item) => {
    const itemSubtotal = (item.total_price * item.quantity) + (item.cut_price || 0);
    return sum + itemSubtotal;
  }, 0);

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

  const preciseRawTotal = Math.max(0, subtotal - discountAmount);
  const total = Math.floor(preciseRawTotal);
  const roundOffAmount = parseFloat(Math.abs(total - preciseRawTotal).toFixed(2));

  // --- Order Placement ---
  const handlePlaceOrder = () => {
    setOrderError("");
    // Normalize phone: strip spaces, +91, leading zeros → pure 10-digit
    let cleanPhone = customerPhone.replace(/[\s\-\(\)]/g, "");
    cleanPhone = cleanPhone.replace(/^\+91/, "");
    cleanPhone = cleanPhone.replace(/^0+/, "");

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setOrderError("Please enter a valid 10-digit Indian phone number.");
      return;
    }
    setCustomerPhone(cleanPhone);

    const purchase_type = orderType === "DELIVERY" ? "home_delivery" : "walk_in_customer";
    const discount_type = discountMode === "MANUAL" ? "manual" : "coupon";
    const discount_value = discountMode === "MANUAL" ? discountAmount : 0;
    const discount_code = discountMode === "COUPON" ? appliedCoupon?.code || "" : "";

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

    const productsPayload = cart.map(item => ({
      type: "custom",
      name: item.name,
      sell_type: item.sell_type,
      weight: item.weight || 0,
      pieces: item.pieces || 0,
      price_per_kg: item.price_per_kg || 0,
      total_price: item.total_price,
      cut_price: item.cut_price || 0,
      quantity: item.quantity || 1,
      note: item.note
    }));

    const payload = {
      purchase_type,
      customer_name: customerName.trim() || "Walk In Customer",
      customer_phone: customerPhone,
      discount_type,
      discount_value,
      discount_code,
      delivery_address,
      payment_method: paymentMethod,
      products: productsPayload,
    };

    createOrderMutation.mutate(payload, {
      onSuccess: async (data) => {
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

        // Reset
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        memoryCustomCustomerName = "";
        memoryCustomCustomerPhone = "";
        setDeliveryAddress(null);
        setManualDiscount(0);
        setDiscountMode("MANUAL");
        setAppliedCoupon(null);
        setCouponCode("");
        setPaymentMethod("cash");
        setItemName("");
        setItemWeight("");
        setItemPricePerKg("");
        setItemCutPrice("");
        setItemQuantity(1);
        setItemNote("");
        setSellType("WEIGHT");

        // Invalidate store order queries so the order list refreshes instantly
        queryClient.invalidateQueries({ queryKey: ["store"] });
      },
      onError: (error) => {
        setOrderError(error?.response?.data?.message || error?.message || "Failed to place order.");
      },
    });
  };

  const handleCloseReceipt = () => {
    setShowReceiptModal(false);
    setReceiptData(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    customerName, setCustomerName,
    customerPhone, setCustomerPhone,
    orderType, setOrderType,
    deliveryAddress, setDeliveryAddress,
    showAddressModal, setShowAddressModal,
    itemName, setItemName,
    itemWeight, setItemWeight,
    itemPricePerKg, setItemPricePerKg,
    itemCutPrice, setItemCutPrice,
    itemQuantity, setItemQuantity,
    itemNote, setItemNote,
    sellType, setSellType,
    cart, addToCart, removeFromCart, updateQuantity,
    subtotal, total, discountAmount, roundOffAmount,
    discountMode, setDiscountMode,
    manualDiscount, setManualDiscount,
    couponCode, setCouponCode,
    appliedCoupon, handleApplyCoupon, clearCoupon, couponError,
    showMobileCart, setShowMobileCart,
    showPreviewModal, setShowPreviewModal,
    showReceiptModal, receiptData, handleCloseReceipt,
    handlePlaceOrder, orderError,
    paymentMethod, setPaymentMethod,
    isPending: createOrderMutation.isPending,

    // Autocomplete exports
    phoneSuggestions,
    isPhoneSearchLoading,
    handleSelectPhoneSuggestion,
    setShowPhoneSuggestions,
  };
};
