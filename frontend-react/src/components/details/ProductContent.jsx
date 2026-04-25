import { MapPinPlus, ShieldCheck, Bell, BellRing } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGetDeliveryTime } from "../../features/useAddress";
import {
  useAddToCart,
  useDecreaseQty,
  useGetCart,
  useIncreaseQty,
  useRemoveCartItem,
} from "../../features/useCart";
import { useStockNotify } from "../../features/useStockNotify";
import useAuth from "../../hooks/useAuth";
import { useLocationManager } from "../../hooks/useLocationManager";
import useStateHooks from "../../shared/hooks/useStateHooks";
import LocationModal from "../LocationModal";
import DetailsCuts from "./Cuts";
import LeftProductContent from "./LeftProductContent";
import NonBargain from "./NonBargain";
import WholesaleBanner from "./WholesaleBanner";

export default function ProductContent({ product }) {
  const [localQuantity, setLocalQuantity] = useState(1);
  const [selectedCutId, setSelectedCutId] = useState(null);
  const [showError, setShowError] = useState(false);
  const [hoveredCutImage, setHoveredCutImage] = useState(null);
  const [selectedWeightId, setSelectedWeightId] = useState(null);

  const [limitError, setLimitError] = useState("");
  const [increaseCooldown, setIncreaseCooldown] = useState(false);
  const [decreaseCooldown, setDecreaseCooldown] = useState(false);
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
  const { data: cart } = useGetCart();
  const { openLogin, setOpenLogin } = useStateHooks();
  const { auth } = useAuth();
  const {
    showLocationModal,
    setShowLocationModal,
    mapCenter,
    handleLocationConfirm,
  } = useLocationManager();
  const { notifyStock, isNotifying, notifyError } = useStockNotify();
  const { data: deliveryData } = useGetDeliveryTime();
  const isProcessing = addToCartMutation.isPending;

  const hasCuts = product?.cuts && product?.cuts?.length > 0;

  const finalCalculatedPrice = useMemo(() => {
    if (!product || !selectedWeightId) return product?.display_price;

    const weightObj = product.weights.find((w) => w.id === selectedWeightId);
    if (!weightObj) return product?.display_price;

    const weightValue = parseFloat(weightObj.weight);
    const weightString = weightObj.weight.toLowerCase();
    const isGram = weightString.includes("g") && !weightString.includes("k");

    // Convert to KG ratio
    const weightRatio = isGram ? weightValue / 1000 : weightValue;
    const basePrice = parseFloat(product.display_price);

    let total = basePrice * weightRatio;

    return Math.round(total);
  }, [product, selectedWeightId]);

  const regularCalculatedPrice = useMemo(() => {
    if (!product || !selectedWeightId || !product.regular_price) return product?.regular_price;

    const weightObj = product.weights.find((w) => w.id === selectedWeightId);
    if (!weightObj) return product?.regular_price;

    const weightValue = parseFloat(weightObj.weight);
    const weightString = weightObj.weight.toLowerCase();
    const isGram = weightString.includes("g") && !weightString.includes("k");

    // Convert to KG ratio
    const weightRatio = isGram ? weightValue / 1000 : weightValue;
    const baseRegularPrice = parseFloat(product.regular_price);
    
    let total = baseRegularPrice * weightRatio;

    return Math.round(total);
  }, [product, selectedWeightId]);

  useEffect(() => {
    if (product?.weights?.length > 0) {
      const defaultWeight = product.weights.find((w) => {
        const label = w.weight.toLowerCase();
        return label.includes("500") && label.includes("g");
      });

      // Fallback to first weight if 500g isn't found
      setSelectedWeightId(defaultWeight ? defaultWeight.id : product.weights[0].id);
    }
  }, [product]);

  useEffect(() => {
    // UPDATED: Always reset selection and error when product changes
    // Do NOT default select anymore
    setSelectedCutId(null);
    setShowError(false);
    setLimitError("");
  }, [product]);

  const matchedCartItem = useMemo(() => {
    if (!cart || !product?.id) return null;

    // If product HAS cuts but none is selected yet, we can't match
    if (hasCuts && !selectedCutId) return null;

    return (
      cart?.items?.find((item) => {
        // Match Product ID
        const sameProduct = item?.product_id === product?.id;
        const sameWeight = item?.product_weight_id === selectedWeightId;

        //  Match Logic based on if cuts exist
        if (hasCuts) {
          const itemCutId = item?.selected_cuts?.[0]?.id;
          return sameProduct && sameWeight && itemCutId === selectedCutId;
        } else {
          // If product has no cuts, just match the product ID
          // (Optionally check that the cart item also has no cuts to be safe)
          return sameProduct && sameWeight;
        }
      }) ?? null
    );
  }, [cart, product, selectedCutId, selectedWeightId, hasCuts]);

  const getWeightInKg = (weightStr) => {
    if (!weightStr) return 0;
    const str = weightStr.toLowerCase();
    const val = parseFloat(str);
    if (str.includes("k")) return val;
    if (str.includes("g")) return val / 1000;
    return 0;
  };

  const isOptimistic = matchedCartItem?.id?.toString().startsWith("opt_");

  const isStockInsufficient = useMemo(() => {
    if (!product || !selectedWeightId || product.isMasalaProduct) return false;

    // If max stock is not defined, strictly we can't block, or we assume unlimited.
    if (
      product.product_max_stock === undefined ||
      product.product_max_stock === null
    )
      return false;

    const maxStock = parseFloat(product.product_max_stock);

    //  Calculate weight of this product already in cart
    const cartItemsForProduct =
      cart?.items?.filter((item) => item.product_id === product.id) || [];

    const currentCartWeight = cartItemsForProduct.reduce((sum, item) => {
      // Find weight object for this cart item to get its weight value
      const wObj = product.weights.find((w) => w.id === item.product_weight_id);
      const wKg = wObj ? getWeightInKg(wObj.weight) : 0;
      return sum + wKg * item.quantity;
    }, 0);

    //  Get weight of CURRENT selection (assuming adding 1 quantity)
    const weightObj = product.weights.find((w) => w.id === selectedWeightId);
    if (!weightObj) return false;

    const selectedWeightInKg = getWeightInKg(weightObj.weight);

    //  Check if Total (Cart + Selection) > Max Stock
    return currentCartWeight + selectedWeightInKg > maxStock;
  }, [product, selectedWeightId, cart]);

  const handleAddToCart = () => {
    if (!product?.id) return;

    // Weight selection check for weight-based products
    if (product.sell_type === "WEIGHT" && !selectedWeightId) {
      setShowError(true);
      return;
    }

    if (hasCuts && !selectedCutId) {
      setShowError(true);
      return; // Stop here, do not add to cart
    }

    const currentCartId = localStorage.getItem("cart_id");

    addToCartMutation.mutate({
      product_id: product.id,
      quantity: localQuantity,
      product_weight_id: selectedWeightId,
      cut_ids: hasCuts ? selectedCutId : null,
      cart_id: currentCartId ? currentCartId : null,
    });
    setShowError(false);
    setLimitError("");
  };

  const handleIncrease = () => {
    if (increaseCooldown || addToCartMutation.isPending || isOptimistic) return;
    startIncreaseCooldown();
    const currentCartId = localStorage.getItem("cart_id");

    // --- Validation Logic Start ---
    const isMasala = product?.isMasalaProduct;
    const maxStock = parseFloat(product.product_max_stock || 0);
    const cartItemsForProduct =
      cart?.items?.filter((item) => item.product_id === product.id) || [];

    if (matchedCartItem) {
      // Item is in cart
      if (isMasala) {
        const currentQty = cartItemsForProduct.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );
        // We want to add +1
        if (currentQty + 1 > maxStock) {
          setLimitError(
            `You can only add up to ${maxStock} items of this product.`,
          );
          return;
        }
      } else {
        // Weight check
        const currentWeight = cartItemsForProduct.reduce((sum, item) => {
          const wObj = product.weights.find(
            (w) => w.id === item.product_weight_id,
          );
          const wKg = wObj ? getWeightInKg(wObj.weight) : 0;
          return sum + wKg * item.quantity;
        }, 0);

        // We are increasing THIS matched item by 1
        const matchedWObj = product.weights.find(
          (w) => w.id === matchedCartItem.product_weight_id,
        );
        const extraWeight = matchedWObj ? getWeightInKg(matchedWObj.weight) : 0;

        if (currentWeight + extraWeight > maxStock) {
          setLimitError(
            `You can only add up to ${maxStock}kg of this product.`,
          );
          return;
        }
      }

      increaseQty.mutate({ id: matchedCartItem.id, cartId: currentCartId });
      setLimitError("");
    }
  };

  const handleDecrease = () => {
    if (decreaseCooldown || addToCartMutation.isPending || isOptimistic) return;
    startDecreaseCooldown();
    setLimitError("");
    const currentCartId = localStorage.getItem("cart_id");
    if (matchedCartItem) {
      // If in cart...
      if (matchedCartItem.quantity > 1) {
        decreaseQty.mutate({ id: matchedCartItem.id, cartId: currentCartId });
      } else {
        removeItem.mutate({ id: matchedCartItem.id, cartId: currentCartId });
      }
    } else {
      // If not in cart...
      setLocalQuantity((prev) => (prev > 1 ? prev - 1 : 1));
    }
  };

  //  Toggle logic acts like a Radio button now
  const handleSelectCut = (cutId) => {
    // If clicking the same one, do nothing (or toggle off if you prefer)
    if (selectedCutId === cutId) return;
    setSelectedCutId(cutId);
    setShowError(false);
  };

  const displayQuantity = matchedCartItem
    ? matchedCartItem.quantity
    : localQuantity;

  const handleNotify = (e, item) => {
    e.stopPropagation();
    if (item?.isStockNotified) return;
    if (!auth?.authToken) {
      setOpenLogin(true);
    } else {
      notifyStock({ product: item?.id });
    }
  };

  const isDeliverable = product?.isInDeliveryZone;
  const selectedWeight = product?.weights?.find(
    (w) => w.id === selectedWeightId,
  );
  const isOneKg =
    selectedWeight?.weight?.toLowerCase().includes("1k") ||
    (selectedWeight?.weight?.toLowerCase().includes("1") &&
      selectedWeight?.weight?.toLowerCase().includes("k"));

  return (
    <div className="single-pro-block">
      {showLocationModal && (
        <LocationModal
          isOpen={showLocationModal}
          mapCenter={mapCenter}
          onClose={() => setShowLocationModal(false)}
          onConfirm={handleLocationConfirm}
        />
      )}
      <div className="single-pro-inner">
        <div className="row">
          <div
            className="d-flex align-items-center  d-block d-lg-none"
            style={{ marginTop: "-25px" }}
          >
            <span className="freshness-badge">
              <span className="shield-shine" aria-hidden="true">
                <ShieldCheck size={18} strokeWidth={1.5} />
              </span>
            </span>
            <span className="freshness-badge">Fishlo Freshness Control</span>
          </div>

          <LeftProductContent product={product} />
          <div className="single-pro-desc m-t-1199">
            <div className="single-pro-content">
              <span className="tooltip-wrap" tabIndex={0}>
                <div className="d-flex align-items-center d-lg-flex d-none">
                  <span className="freshness-badge d-flex align-items-center">
                    <span
                      className="shield-shine"
                      aria-hidden="true"
                      style={{ display: "flex" }}
                    >
                      <ShieldCheck size={18} strokeWidth={1.5} />
                    </span>
                    Fishlo Freshness Control
                  </span>
                </div>

                <span className="tooltip-box" role="tooltip">
                  Each order is carefully selected, hygienically cleaned, and
                  packed fresh at dispatch. Fish that does not meet our quality
                  standards is never shipped.
                </span>
              </span>
              <h5 className="sp-single-title mb-1">{product?.name}</h5>
              <div
                className="product_short_desc"
                dangerouslySetInnerHTML={{ __html: product?.short_description }}
              ></div>
              {product?.sell_type === "PACK" && (
                <div
                  className="d-flex align-items-center justify-content-center bg-light rounded-1 py-2 px-3 mt-2 text-secondary"
                  style={{ maxWidth: "fit-content" }}
                >
                 {(product?.pack_weight_kg || product?.weight) && (
                  <div className="d-flex align-items-center">
                    <i
                      className="fa-solid fa-scale-balanced text-secondary me-2"
                      style={{ fontSize: "0.9rem" }}
                    ></i>
                    <span className="fw-medium small">
                      {product?.sell_type === "PACK" && product?.pack_weight_kg
                        ? product.pack_weight_kg >= 1
                          ? `${parseFloat(product.pack_weight_kg)}kg`
                          : `${parseFloat(product.pack_weight_kg) * 1000}g`
                        : `${parseFloat(product.weight)}${product.weight.replace(
                            /[0-9.]/g,
                            ""
                          )}`}
                    </span>
                  </div>
                )}

                  <>
                    {/* 1. Pieces Block */}
                    {(product?.min_pieces > 0 || product?.max_pieces > 0) && (
                      <div
                        className="mx-2 border-start "
                        style={{ height: "16px", borderColor: "#ccc" }}
                      ></div>
                    )}
                    {(product?.min_pieces > 0 || product?.max_pieces > 0) && (
                      <div className="d-flex align-items-center">
                        <i className="fa-solid fa-utensils me-2 small"></i>
                        <span className="fw-medium small">
                          {product?.min_pieces}
                          {product?.min_pieces && product?.max_pieces && "-"}
                          {product?.max_pieces} Pieces
                        </span>
                      </div>
                    )}

                    {/* 2. Divider before Serves Block */}
                    {(product?.min_serves > 0 || product?.max_serves > 0) && (
                      <div
                        className="mx-2 border-start"
                        style={{ height: "16px", borderColor: "#ccc" }}
                      ></div>
                    )}

                    {/* 3. Serves Block */}
                    {(product?.min_serves > 0 || product?.max_serves > 0) && (
                      <div className="d-flex align-items-center">
                        <i className="fa-solid fa-users me-2 small"></i>
                        <span className="fw-medium small">
                          Serves {product?.min_serves}
                          {product?.min_serves && product?.max_serves && "-"}
                          {product?.max_serves}
                        </span>
                      </div>
                    )}
                  </>
                </div>
              )}
              <div className="sp-single-price-stoke">
              <div className="sp-single-price">
                {product?.sell_type !== "WEIGHT" && (
                  <div className="final-price">
                    ₹{finalCalculatedPrice}
                    {(product?.isMasalaProduct || product?.sell_type === "PACK") && (
                      <>
                        {regularCalculatedPrice &&
                          Number(finalCalculatedPrice) !== Number(regularCalculatedPrice) && (
                            <span className="mrp">₹{regularCalculatedPrice}</span>
                          )}
                        {product?.discount_percentage > 0 && (
                          <span className="price-des">
                            {product?.discount_percentage}% off
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
                <div className="sp-single-stoke">
                  <span className="sp-single-ps-title">
                    {product?.is_available ? "IN STOCK" : "OUT OF STOCK"}
                  </span>
                </div>
              </div>
              
              {/* Product weight  */}
                {product?.weights?.length > 0 && (
                  <div className="d-flex flex-column gap-2 my-3">
                    {product.weights.map((w) => {
                      const isSelected = selectedWeightId === w.id;

                      const weightPrice = Math.round(parseFloat(product.display_price) * parseFloat(w.weight_kg));
                      const regularWeightPrice = product.regular_price
                        ? Math.round(parseFloat(product.regular_price) * parseFloat(w.weight_kg))
                        : null;

                      const hasDiscount =
                        regularWeightPrice && regularWeightPrice !== weightPrice;

                      return (
                        <div
                          key={w.id}
                          onClick={() => setSelectedWeightId(w.id)}
                          style={{
                            cursor: "pointer",
                            border: isSelected ? "2px solid #27ae60" : "1.5px solid #ddd",
                            borderRadius: "12px",
                            padding: "12px 16px",
                            backgroundColor: isSelected ? "#f0faf4" : "#fff",
                            transition: "0.2s ease-in-out",
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-between">
                            {/* Left: Radio + Weight label + pieces */}
                            <div className="d-flex align-items-center gap-2">
                              <div
                                style={{
                                  width: "22px",
                                  height: "22px",
                                  borderRadius: "50%",
                                  border: isSelected ? "none" : "2px solid #bbb",
                                  backgroundColor: isSelected ? "#27ae60" : "transparent",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {isSelected && (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <span style={{ fontWeight: "600", fontSize: "1rem", color: "#222" }}>
                                  {w.display_label}
                                  {w.pieces_info &&
                                  (w.pieces_info.min !== 0 || w.pieces_info.max !== 0) && (
                                    <span style={{ fontWeight: "400", color: "#555", fontSize: "0.95rem" }}>
                                      {" | "}
                                      {w.pieces_info.min !== 0 && w.pieces_info.min}
                                      {w.pieces_info.max !== 0 &&
                                        (w.pieces_info.min !== 0 ? `–${w.pieces_info.max}` : w.pieces_info.max)
                                      } pcs
                                    </span>
                                  )}
                                  </span>
                                {w.net_weight_info && (
                                  <div style={{ fontSize: "0.82rem", color: "#777", marginTop: "2px" }}>
                                    {w.net_weight_info}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right: Better Value + strikethrough + price + discount % */}
                            <div style={{ textAlign: "right" }}>
                              {/* Top row: Better Value badge + strikethrough */}
                              <div className="d-flex align-items-center justify-content-end gap-2" style={{ marginBottom: "2px" }}>
                                {w.is_better_value && (
                                  <span
                                    style={{
                                      backgroundColor: "#27ae60",
                                      color: "#fff",
                                      borderRadius: "20px",
                                      padding: "1px 8px",
                                      fontSize: "0.72rem",
                                      fontWeight: "600",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    Best value
                                  </span>
                                )}
                                {hasDiscount && (
                                  <span style={{ fontSize: "0.8rem", color: "#aaa", textDecoration: "line-through" }}>
                                    ₹{regularWeightPrice}
                                  </span>
                                )}
                              </div>

                              {/* Bottom row: final price + % off */}
                              <div className="d-flex align-items-baseline justify-content-end gap-1">
                                <span style={{ fontWeight: "700", fontSize: "1.05rem", color: isSelected ? "#27ae60" : "#222" }}>
                                  ₹{weightPrice}
                                </span>
                                {hasDiscount && product?.discount_percentage > 0 && (
                                  <span style={{ fontSize: "0.72rem", color: "#c0392b", fontWeight: "600" }}>
                                    {product.discount_percentage}% off
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              <DetailsCuts
                hoveredCutImage={hoveredCutImage}
                product={product}
                selectedCutId={selectedCutId}
                handleSelectCut={handleSelectCut}
                setHoveredCutImage={setHoveredCutImage}
              />
              {showError && (
                <div
                  style={{
                    color: "#E4645A",
                    fontWeight: "400",
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  {product?.sell_type === "WEIGHT" &&
                  !selectedWeightId &&
                  !selectedCutId
                    ? "Cannot add this weighted product. Please select Weight and Cut options."
                    : product?.sell_type === "WEIGHT" && !selectedWeightId
                      ? "Weight required. Please select a weight option before adding."
                      : "Please select all required options."}
                </div>
              )}
              {limitError && (
                <div
                  style={{
                    color: "#E4645A",
                    fontWeight: "400",
                    marginBottom: "10px",
                    fontSize: "14px",
                  }}
                >
                  <i
                    className="fa-solid fa-circle-exclamation"
                    style={{ marginRight: "6px" }}
                  ></i>
                  {limitError}
                </div>
              )}
              {!isDeliverable ? (
                /* CASE 1: NOT DELIVERABLE */
                <div className="out-of-zone-action-box">
                  <div className="alert alert-danger d-flex align-items-center small py-2">
                    <i className="ri-map-pin-warning-line me-2 fs-5"></i>
                    This product is currently not deliverable to your location.
                  </div>
                  <button
                    className="btn sp-btn-1 accent-gradient"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLocationModal(true);
                    }}
                  >
                    <MapPinPlus size={24} />
                    Change
                  </button>
                </div>
              ) : product?.isOutOfStock ? (
                <div style={{ fontWeight: "600", color: "#E4645A" }}>
                  OUT OF STOCK
                </div>
              ) : isStockInsufficient && !matchedCartItem ? (
                /* CASE: Not in cart AND selected weight exceeds stock */
                <div
                  className="alert alert-warning d-flex align-items-center "
                  role="alert"
                  style={{ fontSize: "0.9rem" }}
                >
                  <i
                    className="fa-solid fa-triangle-exclamation me-2"
                    style={{ fontSize: "1rem" }}
                  ></i>
                  <div>
                    The selected weight is currently unavailable. Please select
                    a smaller weight.
                  </div>
                </div>
              ) : (
                <div className="sp-single-qty">
                  {!matchedCartItem ? (
                    <div className="sp-single-cart" onClick={handleAddToCart}>
                      <a
                        className="btn sp-btn-1 accent-gradient"
                        style={{
                          opacity: isProcessing ? 0.8 : 1,
                          cursor: isProcessing ? "not-allowed" : "pointer",
                          border: "none",
                        }}
                      >
                        {addToCartMutation.isPending ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Adding...
                          </>
                        ) : (
                          "Add To Cart"
                        )}
                      </a>
                    </div>
                  ) : (
                    <>
                      <div className="qty-plus-minus">
                        <div
                          className="dec sp-qtybtn qp-qtybtn"
                          onClick={handleDecrease}
                          style={{
                            pointerEvents:
                              decreaseCooldown || isProcessing || isOptimistic
                                ? "none"
                                : "auto",
                            opacity:
                              decreaseCooldown || isProcessing || isOptimistic
                                ? 0.5
                                : 1,
                            cursor: "pointer",
                          }}
                        >
                          <i
                            className="fa-solid fa-minus fa-sm"
                            style={{ color: "#393f4a" }}
                          ></i>
                        </div>
                        <input
                          className="qty-input"
                          type="text"
                          value={displayQuantity}
                          readOnly
                        />
                        <div
                          className="inc sp-qtybtn qp-qtybtn"
                          onClick={
                            isStockInsufficient ? undefined : handleIncrease
                          }
                          style={{
                            pointerEvents:
                              isStockInsufficient ||
                              increaseCooldown ||
                              isProcessing ||
                              isOptimistic
                                ? "none"
                                : "auto",
                            opacity:
                              isStockInsufficient ||
                              increaseCooldown ||
                              isProcessing ||
                              isOptimistic
                                ? 0.4
                                : 1,
                            cursor: isStockInsufficient
                              ? "not-allowed"
                              : "pointer",
                          }}
                        >
                          <i
                            className="fa-solid fa-plus fa-sm"
                            style={{
                              color: isStockInsufficient ? "#aaa" : "#393f4a",
                            }}
                          ></i>
                        </div>
                      </div>
                      {/* {isStockInsufficient && (
                        <div
                          className="d-flex align-items-center mt-2"
                          style={{
                            color: "#E4645A",
                            fontSize: "0.85rem",
                          }}
                        >
                          <i
                            className="fa-solid fa-circle-exclamation me-1"
                            style={{ fontSize: "0.8rem" }}
                          ></i>
                          Max stock limit reached for this product.
                        </div>
                      )} */}
                    </>
                  )}
                </div>
              )}
              {!isDeliverable ? (
                <div className="mb-2"></div>
              ) : product?.isOutOfStock ? (
                <div className="deatails-notify-footer">
                  <span className="deatails-notify-text">
                    {product?.isStockNotified
                      ? "We will notify you!"
                      : "Get notified when available"}
                  </span>
                  <button
                    className="deatails-btn-notify-me"
                    onClick={(e) => handleNotify(e, product)}
                    disabled={isNotifying || product?.isStockNotified}
                  >
                    {product?.isStockNotified ? "Notified" : "Notify"}
                    {product?.isStockNotified ? (
                      <BellRing size={14} color="#27ae60" fill="#27ae60" />
                    ) : (
                      <Bell size={14} color="#d7574c" fill="#d7574c" />
                    )}
                  </button>

                </div>
              ) : (
                <div className="delivery-info-main">
                  <i className="ri-flashlight-fill delivery-icon"></i>
                  <span>{deliveryData?.message}</span>
                </div>
              )}
            </div>

            <div className="container p-0 my-3">
              <div className="offer-border rounded">
                <div className="alert alert-success rounded mb-0 py-2 offer-alert">
                  <div className="d-flex justify-content-between align-items-center">
                    {/* LEFT SIDE */}
                    <div>
                      <div className="fs-6">
                        <span className="fw-medium">🎉 Get 20% OFF upto INR 200</span> +{" "}
                        <span className="fw-medium text-success-emphasis">
                             Free Delivery
                        </span>
                      </div>
                      <div className="small">*On your first order.</div>
                    </div>
                    {/* RIGHT SIDE */}
                    <div>
                      <span className="badge bg-success text-light px-3 py-2">
                        Code: FISHLO
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {!product?.isMasalaProduct && (
              <div className="mb-3 d-lg-none d-block">
                {product?.category?.slug?.toLowerCase().includes("frozen") ||
                product?.category?.name?.toLowerCase().includes("frozen") ||
                product?.subcategory?.slug?.toLowerCase().includes("frozen") ||
                product?.subcategory?.name?.toLowerCase().includes("frozen") ? (
                  <WholesaleBanner />
                ) : (
                  <NonBargain />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
