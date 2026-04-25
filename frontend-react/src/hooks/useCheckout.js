import { useEffect, useState } from "react";
import { useRazorpay } from "react-razorpay";
import { useNavigate } from "react-router-dom";
import { useGetAddress } from "../features/useAddress";
import { useGetCart } from "../features/useCart";
import {
  useGetAvailableCoupons,
  useValidateCoupon,
} from "../features/useCoupon";
import {
  useCancelOrder,
  useCreateOrder,
  useVerifyPayment,
} from "../features/useCreateOrder";
import { useDeliverySlots } from "../features/useDeliverySlots";
import { useGetProfile } from "../features/useGetProfile";
import { useAddressWorkflow } from "./useAddressWorkflow";

export const useCheckout = () => {
  const [sameAsDelivery, setSameAsDelivery] = useState(true);
  const {
    state: { isMapOpen, isAddressModalOpen, mapAddressData, autoValidate, selectedAddressId },
    actions: { setIsMapOpen, setIsAddressModalOpen, setMapAddressData, setAutoValidate, setSelectedAddressId, handleAddNewClick, handleMapConfirm, switchToMapMode, handleEditClick }
  } = useAddressWorkflow();
  const [paymentMethod, setPaymentMethod] = useState("Razorpay");
  const [paymentError, setPaymentError] = useState(null);

  // Delivery Slot State
  const [deliveryDay, setDeliveryDay] = useState("TODAY");
  const [deliverySlotId, setDeliverySlotId] = useState(null);
  const [todaySlotId, setTodaySlotId] = useState(null);
  const [tomorrowSlotId, setTomorrowSlotId] = useState(null);
  const [hasAutoSelectedSlot, setHasAutoSelectedSlot] = useState(false);
  const [slotValidationError, setSlotValidationError] = useState(null);
  const {
    data: slotsData,
    isPending: isSlotsLoading,
    isError: isSlotsError,
    error: slotsError,
  } = useDeliverySlots();

  useEffect(() => {
    if (slotsData && !hasAutoSelectedSlot) {
      const todaySlots = slotsData?.data?.today?.slots || [];
      const tomorrowSlots = slotsData?.data?.tomorrow?.slots || [];

      const firstToday = todaySlots.find((s) => s.is_active);

      if (firstToday) {
        setDeliveryDay("TODAY");
        setDeliverySlotId(firstToday.id);
        setTodaySlotId(firstToday.id);
      } else {
        const firstTomorrow = tomorrowSlots.find((s) => s.is_active);
        if (firstTomorrow) {
          setDeliveryDay("TOMORROW");
          setDeliverySlotId(firstTomorrow.id);
          setTomorrowSlotId(firstTomorrow.id);
        }
      }
      setHasAutoSelectedSlot(true);
    }
  }, [slotsData, hasAutoSelectedSlot]);

  const [billingAddress, setBillingAddress] = useState({
    full_name: "",
    phone: "",
    email: "",
    house_details: "",
    city: "",
    state: "",
    postal_code: "",
  });
  const [billingErrors, setBillingErrors] = useState({});
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [userRemovedCoupon, setUserRemovedCoupon] = useState(false);
  const [notes, setNotes] = useState("");
  const { Razorpay, isPending: isRazorpayLoading } = useRazorpay();
  const { mutate: createOrder, isPending: isCreatingOrder } = useCreateOrder();
  const { mutate: cancelOrder } = useCancelOrder();
  const { mutate: verifyPayment, isPending: isPaymentVerifying } =
    useVerifyPayment();
  const { data: profileData } = useGetProfile();
  const {
    data: addressData,
    isPending: isAddressLoading,
    isError: isAddressError,
  } = useGetAddress();
  const {
    data: cart,
    isPending: cartLoading,
    isFetching: cartFetching,
  } = useGetCart(selectedAddressId);
  const { data: couponsData, isPending: isCouponsLoading } =
    useGetAvailableCoupons();
  const {
    mutate: validateCoupon,
    isPending: isValidatingCoupon,
    error,
  } = useValidateCoupon();

  // Auto-apply FISHLO coupon for first-time users
  useEffect(() => {
    // Check if it's their first order
    if (
      cart?.is_first_order &&
      !appliedCoupon &&
      !userRemovedCoupon &&
      !isValidatingCoupon &&
      cart?.items?.length > 0
    ) {
      validateCoupon(
        "FISHLO",
        {
          onSuccess: (res) => {
            if (res.success) {
              setAppliedCoupon(res.data);
            }
          },
        }
      );
    }
  }, [appliedCoupon, validateCoupon, isValidatingCoupon, cart, userRemovedCoupon]);

  // Extract shared total amount calculation
  const subtotal = cart?.subtotal ?? 0;
  const deliveryChargeObj = cart?.delivery_charge;
  const isFreeDelivery =
    deliveryChargeObj?.charge_type === "FREE" ||
    parseFloat(deliveryChargeObj?.charge_amount) === 0 ||
    appliedCoupon?.code?.toUpperCase() === "FISHLO";

  const deliveryFee = isFreeDelivery
    ? 0
    : parseFloat(deliveryChargeObj?.charge_amount || 0);

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;

    if (appliedCoupon.min_order_amount && subtotal < parseFloat(appliedCoupon.min_order_amount)) {
      return 0;
    }

    if (appliedCoupon.discount_type === "PERCENTAGE") {
      let calc = subtotal * (parseFloat(appliedCoupon.discount_percentage) / 100);
      if (appliedCoupon.max_discount) {
        calc = Math.min(calc, parseFloat(appliedCoupon.max_discount));
      }
      return calc;
    }

    return parseFloat(appliedCoupon.discount_fixed_amount) || 0;
  };

  const discountVal = calculateDiscount();
  const rawValue = Math.max(0, subtotal - discountVal + deliveryFee);
  const totalAmount = Math.floor(rawValue);

  const minimumPreOrderAmount = cart?.items?.[0]?.minimum_order_amount || 0;
  const partialPayPercentage = cart?.items?.[0]?.partial_pay_pre_order_percentage || 0;



  const pct = parseFloat(partialPayPercentage) || 0;
  const minAmount = parseFloat(minimumPreOrderAmount) || 0;
  const isBelowMinimum = minAmount > 0 && totalAmount < minAmount;
  const isFeatureConfigured = pct > 0;

  const isPartialPayEligible = isFeatureConfigured && !isBelowMinimum;

  useEffect(() => {
    if (paymentMethod === "UPI_ON_DELIVERY") {
      if (!isPartialPayEligible || deliveryDay === "TODAY") {
        setPaymentMethod("Razorpay");
      }
    }
  }, [deliveryDay, isPartialPayEligible, paymentMethod]);

  const partialPayAmount = isPartialPayEligible
    ? Math.floor(totalAmount * (pct / 100))
    : 0;

  const COD_MIN = cart?.min_cod_amount ? parseFloat(cart.min_cod_amount) : 299;
  const COD_MAX = cart?.max_cod_amount ? parseFloat(cart.max_cod_amount) : 1999;
  const isCodEligible = totalAmount >= COD_MIN && totalAmount <= COD_MAX;

  useEffect(() => {
    if (paymentMethod === "COD") {
      if (!isCodEligible) {
        setPaymentMethod("Razorpay");
      }
    }
  }, [isCodEligible, paymentMethod]);

  const navigate = useNavigate();
  const allAddresses = addressData?.addresses || [];

  const validateBilling = () => {
    const newErrors = {};
    if (!sameAsDelivery) {
      // Full Name
      if (!billingAddress.full_name?.trim()) {
        newErrors.full_name = "Name is required";
      } else if (billingAddress.full_name.length > 25) {
        newErrors.full_name = "Name must be under 25 characters";
      }

      // Phone
      if (!billingAddress.phone?.trim()) {
        newErrors.phone = "Phone is required";
      } else if (billingAddress.phone.length > 12) {
        newErrors.phone = "Phone number is too long";
      }

      // Address / House Details
      if (!billingAddress.house_details?.trim()) {
        newErrors.house_details = "Address is required";
      } else if (billingAddress.house_details.length > 250) {
        newErrors.house_details = "Address is too long (max 250)";
      }

      // City & State
      if (!billingAddress.city?.trim()) {
        newErrors.city = "City is required";
      } else if (billingAddress.city.length > 50) {
        newErrors.city = "City name is too long";
      }

      if (!billingAddress.state?.trim()) {
        newErrors.state = "State is required";
      } else if (billingAddress.state.length > 50) {
        newErrors.state = "State name is too long";
      }

      // Pincode
      if (!billingAddress.postal_code?.trim()) {
        newErrors.postal_code = "Pincode is required";
      } else if (billingAddress.postal_code.length > 6) {
        newErrors.postal_code = "Pincode is too long";
      }
    }
    setBillingErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  useEffect(() => {
    if (allAddresses?.length > 0 && !selectedAddressId) {
      const defaultAddr = allAddresses.find((addr) => addr.is_default);
      // Explicitly use the ID from the found object or first item
      const initialId = defaultAddr ? defaultAddr.id : allAddresses[0].id;
      setSelectedAddressId(initialId);
    }
  }, [allAddresses, selectedAddressId]);

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBillingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const isAddressComplete = (addr) => {
    const requiredFields = [
      "recipient_name",
      "recipient_phone",
      "house_details",
      "city",
      "state",
      "postal_code",
    ];
    for (const field of requiredFields) {
      if (!addr[field] || addr[field].toString().trim() === "") return false;
    }
    return true;
  };

  const initiateRazorpay = (orderResponse) => {
    setPaymentError(null);
    const { razorpay_order, data } = orderResponse;

    const options = {
      key: razorpay_order.key_id,
      amount: razorpay_order.amount,
      currency: razorpay_order.currency,
      name: "Fishlo",
      description:
        paymentMethod === "UPI_ON_DELIVERY"
          ? "Order Confirmation Fee"
          : `Order #${data.order_number}`,
      image:
        "https://rathank.com/wp-content/uploads/2025/12/fishlo-logo-v0-coral.png",
      order_id: razorpay_order.gateway_order_id,
      handler: (res) => {
        const verificationPayload = {
          order_id: data.order_id,
          payment_data: {
            razorpay_order_id: res.razorpay_order_id,
            razorpay_payment_id: res.razorpay_payment_id,
            razorpay_signature: res.razorpay_signature,
          },
        };
        verifyPayment(verificationPayload, {
          onSuccess: (verifyRes) => {
            //  Redirect only after backend confirms payment
            navigate(`/order/success?order_id=${verifyRes.data.order_number}`, {
              replace: true,
            });
          },
          onError: (err) => {
            // alert("Payment verification failed. Please contact support.");
            navigate(`/order/failure`, {
              replace: true,
              state: {
                orderNumber: data.order_number,
                amount: razorpay_order.amount / 100,
              },
            });
          },
        });
      },
      prefill: {
        name: profileData?.full_name || billingAddress.full_name || "",
        email: profileData?.email || billingAddress.email || "",
        contact: profileData?.phone || billingAddress.phone || "",
      },
      modal: {
        ondismiss: () => {
          setPaymentError(
            "Payment was cancelled. Please try again to complete your order."
          );
          cancelOrder(data.order_number);
        },
      },
    };
    const rzp = new Razorpay(options);
    rzp.open();
  };

  const isInDeliveryZone =
    cart?.items?.length > 0 ? cart?.items[0]?.isInDeliveryZone : true;

  const MAX_ORDER_LIMIT = 460000;

  const handlePlaceOrder = (e) => {
    if (e) e.preventDefault();
    setPaymentError(null);

    //  HARD SECURITY CHECK: Prevent execution if over limit
    if (totalAmount > MAX_ORDER_LIMIT) {
      setPaymentError(
        `Order amount exceeds the limit of ₹4,60,000. Current total: ₹${totalAmount.toLocaleString()}`
      );
      return; // Stop the function here
    }

    const hasOutOfStockItems = cart?.items?.some((item) => item.isOutOfStock);
    if (hasOutOfStockItems) {
      setPaymentError("Please remove out of stock items from your cart before proceeding.");
      return;
    }

    if (!isInDeliveryZone) {
      setPaymentError("Sorry, we do not deliver to this location yet.");
      return;
    }

    if (isCreatingOrder || isPaymentVerifying) return;

    const selectedAddress = allAddresses?.find(
      (a) => a.id === selectedAddressId
    );

    if (!selectedAddress) {
      setPaymentError("Please select a delivery address.");
      return;
    }

    if (!isAddressComplete(selectedAddress)) {
      handleEditClick(selectedAddress, true);
      return;
    }

    // Delivery Slot Validation
    if (!deliveryDay || !deliverySlotId) {
      setSlotValidationError("Please select a delivery slot.");
      document
        .getElementById("delivery-slots-section")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!paymentMethod) {
      setPaymentError("Please select a payment method.");
      return;
    }

    if (paymentMethod === "COD" && !isCodEligible) {
      setPaymentError(`Cash on Delivery is only available for orders between ₹${COD_MIN} and ₹${COD_MAX}.`);
      return;
    }

    if (!sameAsDelivery && !validateBilling()) {
      document
        .getElementById("billing-section")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const finalOrderData = {
      address_id: selectedAddressId,
      notes: notes || "",
      is_billing_same_as_shipping: sameAsDelivery,
      payment_method: paymentMethod,
      discount_code: appliedCoupon?.code || "",
      delivery_day: deliveryDay,
      delivery_slot_id: deliverySlotId,
      ...(!sameAsDelivery && {
        full_name: billingAddress.full_name,
        phone_number: billingAddress.phone,
        email: billingAddress.email,
        house_details: billingAddress.house_details,
        city: billingAddress.city,
        state: billingAddress.state,
        postal_code: billingAddress.postal_code,
      }),
    };

    createOrder(finalOrderData, {
      onSuccess: (res) => {
        if (res.razorpay_order) {
          initiateRazorpay(res);
        } else {
          navigate(`/order/success?order_id=${res.data.order_number}`, {
            replace: true,
          });
        }
      },
      onError: (err) => {
        // console.log(err),
        setPaymentError(err.response?.data?.message || "Order creation failed");
      },
      // console.log("errror", err),
    });
  };

  return {
    state: {
      sameAsDelivery,
      isMapOpen,
      isAddressModalOpen,
      mapAddressData,
      selectedAddressId,
      autoValidate,
      billingAddress,
      billingErrors,
      isAddressLoading,
      isAddressError,
      allAddresses,
      paymentMethod,
      appliedCoupon,
      isCreatingOrder,
      isPaymentVerifying,
      isValidatingCoupon,
      couponsData,
      isCouponsLoading,
      cart,
      cartLoading,
      paymentError,
      addressData,
      deliveryDay,
      deliverySlotId,
      slotsData,
      isSlotsLoading,
      isSlotsError,
      isSlotsError,
      slotsError,
      slotValidationError,
      totalAmount,
      subtotal,
      deliveryFee,
      discountVal,
      isFreeDelivery,
      isPartialPayEligible,
      partialPayAmount,
      partialPayPercentage,
      minimumPreOrderAmount,
      isCodEligible,
      COD_MIN,
      COD_MAX,
    },
    actions: {
      setSameAsDelivery,
      setIsMapOpen,
      setIsAddressModalOpen,
      setSelectedAddressId,
      setAppliedCoupon,
      setUserRemovedCoupon,
      handleBillingChange,
      handleAddNewClick,
      handleMapConfirm,
      handleEditClick,
      handlePlaceOrder,
      setPaymentMethod,
      validateCoupon,
      switchToMapMode,
      setDeliveryDay: (day) => {
        setDeliveryDay(day);
        // Restore the previously selected slot for this day
        const savedSlot = day === "TODAY" ? todaySlotId : tomorrowSlotId;
        setDeliverySlotId(savedSlot);
        if (savedSlot) setSlotValidationError(null);
      },
      setDeliverySlotId: (id) => {
        setDeliverySlotId(id);
        // Save the selection for the current day
        if (deliveryDay === "TODAY") {
          setTodaySlotId(id);
        } else {
          setTomorrowSlotId(id);
        }
        if (id) setSlotValidationError(null);
      },
    },
  };
};
