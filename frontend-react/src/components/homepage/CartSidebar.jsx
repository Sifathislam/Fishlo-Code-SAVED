import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ReactGA from "react-ga4";
import { useGetPromotionBanners } from "../../features/useBanner";
import {
  useDecreaseQty,
  useGetCart,
  useIncreaseQty,
  useRemoveCartItem,
} from "../../features/useCart";
import useAuth from "../../hooks/useAuth";
import useStateHooks from "../../shared/hooks/useStateHooks";
import AddressModal from "../AddressModal";
import LocationModal from "../LocationModal";
import { useGetDeliveryTime, useGetAddress } from "../../features/useAddress";
import { useAddressWorkflow } from "../../hooks/useAddressWorkflow";

export default function CartSidebar({ cartOpen, setCartOpen }) {
  const { data: cart, isPending } = useGetCart();

  const { setOpenLogin } = useStateHooks();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const items = cart?.items ?? [];


  const removeItem = useRemoveCartItem();
  const increaseQty = useIncreaseQty();
  const decreaseQty = useDecreaseQty();
  const { data: cartTopBanner, isLoading: isCartTopLoading } =
    useGetPromotionBanners({
      placement: "CART_TOP_BANNER",
    });
  const { data: cartBottomBanner, isLoading: isCartBottomLoading } =
    useGetPromotionBanners({
      placement: "CART_BOTTOM_BANNER",
    });

  const location = useLocation();
  const { data: deliveryData } = useGetDeliveryTime();
  const { data: addressData } = useGetAddress();

  const {
    state: { isMapOpen, isAddressModalOpen, mapAddressData, autoValidate },
    actions: { handleAddNewClick, handleMapConfirm, switchToMapMode, setIsMapOpen, setIsAddressModalOpen, setSelectedAddressId }
  } = useAddressWorkflow();

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

  useEffect(() => {
    if (location.state?.triggerAddAddress) {
      // 1. Trigger the modal
      handleAddNewClick();

      // 2. "Consume" the state so it doesn't fire again on reload
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (cartOpen && cart?.items?.length > 0) {
      ReactGA.event("view_cart", {
        currency: "INR",
        value: cart.subtotal,
        items: cart.items.map(item => ({
          item_id: item.product_slug,
          item_name: item.product_name,
          price: item.unit_price,
          quantity: item.quantity
        }))
      });
    }
  }, [cartOpen, cart]);

  const isProcessing = decreaseQty.isPending || removeItem.isPending;

  const closeCart = (e) => {
    if (e) e.preventDefault();
    setCartOpen(false);
  };

  const navigateCheckout = () => {
    if (!cart?.items || cart.items.length === 0) {
      return;
    }
    if (!(auth?.authToken || auth?.refreshToken)) {
      setCartOpen(false);
      setOpenLogin(true); // Open the login modal
      return;
    }
    if (!addressData?.addresses || addressData?.addresses.length === 0) {
      // Close cart first so the user can see the address form clearly
      setCartOpen(false);
      handleAddNewClick();
      return;
    }
    navigate("/checkout");
    setCartOpen(false);
  };

  const handleRemove = (e, id) => {
    e?.preventDefault();
    const currentCartId = localStorage.getItem("cart_id");
    // prevent double clicks while removing
    if (removeItem.isLoading) return;
    removeItem.mutate({ id, cartId: currentCartId });
  };

  const handleIncrease = (e, id) => {
    e?.preventDefault();
    if (increaseCooldown) return;
    startIncreaseCooldown();

    const currentCartId = localStorage.getItem("cart_id");
    increaseQty.mutate({ id, cartId: currentCartId });
  };

  const handleDecrease = (e, item) => {
    e?.preventDefault();
    if (decreaseCooldown) return;
    startDecreaseCooldown();

    const currentCartId = localStorage.getItem("cart_id");
    // if quantity is 1 and user presses "-", remove item instead
    if (item.quantity <= 1) {
      removeItem.mutate({ id: item.id, cartId: currentCartId });
    } else {
      decreaseQty.mutate({ id: item.id, cartId: currentCartId });
    }
  };
  const hasOutOfZoneItems = items.some(
    (item) => item.isInDeliveryZone === false,
  );
  // const isBlocked = items.length === 0 || hasOutOfZoneItems;
  const isBlocked = items.length === 0;

  const handleBannerClick = (link) => {
    setCartOpen(false);
    if (link) {
      navigate(link);
    }
  };

  const cartTopPromotion = cartTopBanner?.[0];
  const cartBottomPromotion = cartBottomBanner?.[0];

  /* Helper to check if stock limit is reached */
  const getIsMaxReached = (item) => {
    const isWeighted = item?.is_weighted_product;
    const maxStock = parseFloat(item?.product_max_stock || 0);

    if (maxStock <= 0) return true;

    // Helper to extract numeric weight from string (e.g., "250g" -> 0.25, "1kg" -> 1)
    const getUnitWeight = (weightStr) => {
      const s = weightStr?.toLowerCase() || "";
      if (s.includes("kg")) {
        return parseFloat(s.replace("kg", "").trim()) || 0;
      } else if (s.includes("g")) {
        return (parseFloat(s.replace("g", "").trim()) || 0) / 1000;
      }
      return 0;
    };

    if (isWeighted) {
      const currentUnitWeight = getUnitWeight(item?.weight);

      // Calculate total weight of this product across all its variants in the cart
      const totalWeightInCart = items
        .filter((i) => i.product_id === item.product_id)
        .reduce((sum, i) => sum + i.quantity * getUnitWeight(i.weight), 0);

      // Check if adding one more unit of THIS item exceeds max stock
      return totalWeightInCart + currentUnitWeight > maxStock + 0.001;
    } else {
      // For non-weighted (packed) items, check total quantity of this product
      const totalQtyInCart = items
        .filter((i) => i.product_id === item.product_id)
        .reduce((sum, i) => sum + i.quantity, 0);

      return totalQtyInCart >= maxStock;
    }
  };
 

  return (
    <>
      {/* OVERLAY */}
      <div
        className={`sp-side-cart-overlay ${cartOpen ? "visible" : ""}`}
        data-cursor="hide"
        onClick={closeCart}
      ></div>

      {/* SIDEBAR */}
      <div
        className={`sp-side-cart ${cartOpen ? "sp-open-cart" : ""}`}
        data-cursor="hide"
      >
        <div className="row h-full">
          <div className="col-md-12 col-12">
            <div className="sp-inner-cart">
              {/* TOP — TITLE + CLOSE BTN */}
              <div className="sp-top-contact">
                <div className="sp-cart-title">
                  <h4>My cart</h4>
                  <button
                    type="button"
                    className="sp-cart-close"
                    title="Close Cart"
                    onClick={closeCart}
                  />
                </div>
                <div className="cart-delivery-info">
                  <i className="ri-flashlight-fill delivery-icon"></i>
                  {/* <span>{"Standard Delivery"}</span> */}
                  <span>{deliveryData?.message}</span>
                </div>
              </div>

              {/* CART ITEMS */}
              <div className="sp-cart-box item">
                {cartTopPromotion?.title && (
                  <div className="cart-top-banner-container">
                    <div
                      className="cart-banner-wrapper d-lg-block d-none"
                      onClick={() =>
                        handleBannerClick(cartTopPromotion?.link_url)
                      }
                    >
                      <img
                        src={cartTopPromotion?.image_desktop}
                        alt="Top Offer"
                        className="cart-promo-banner-img"
                      />
                    </div>
                    <div
                      className="cart-banner-wrapper d-block d-lg-none"
                      onClick={() =>
                        handleBannerClick(cartTopPromotion?.link_url)
                      }
                    >
                      <img
                        src={cartTopPromotion?.image_mobile}
                        alt="Top Offer"
                        className="cart-promo-banner-img"
                      />
                    </div>
                  </div>
                )}
                <ul className="sp-cart-items">
                  {items.length === 0 && (
                    <li className="empty-cart">Your cart is empty.</li>
                  )}
                  {/* ITEM 1 */}
                  {items?.map((item) => {
                    const isMaxReached = getIsMaxReached(item);
                    const isActionDisabled = !item?.isInDeliveryZone || item?.isOutOfStock;
                    // const isOptimistic = item?.id?.toString().startsWith("opt_");

                    return (
                      <li key={item?.id} className="cart-sidebar-list">
                        <button
                          className="cart-remove-item"
                          onClick={(e) => handleRemove(e, item?.id)}
                          aria-label={`Remove ${item?.product_name}`}
                          disabled={removeItem?.isLoading}
                        >
                          <i className="ri-close-line" />
                        </button>

                        <div
                          className={`sp-cart-pro-img ${!item?.isInDeliveryZone || item?.isOutOfStock ? "cart-out-of-zone" : ""
                            }`}
                        >
                          <img
                            src={item?.product_image || "name"}
                            alt={item?.product_name || "name"}
                            className={
                              item?.isOutOfStock || !item?.isInDeliveryZone
                                ? "out-of-stock-saturation"
                                : ""
                            }
                          />

                          {/* Overlay label shown only when out of zone or out of stock */}
                          {(!item?.isInDeliveryZone || item?.isOutOfStock) && (
                            <div className="out-of-zone-label">
                              {!item?.isInDeliveryZone ? "OUT OF DELIVERY ZONE" : "PRE-ORDER"}
                            </div>
                          )}
                        </div>

                        <div className="sp-cart-list-detail">
                          <Link
                            to={`/${item?.product_slug}`}
                            className="sp-cart-sub-title"
                          >
                            {item?.product_name}
                          </Link>

                          <div className="d-flex gap-3 mt-1">
                            <span className="cart-price">
                              ₹
                              <span className="new-price cart-item-price">
                                {item?.unit_price}{" "}
                              </span>
                              x {item?.quantity}
                            </span>
                            {item?.is_weighted_product && (
                              <div
                                className=""
                                style={{ fontSize: "12px", marginTop: "" }}
                              >
                                {item.weight}
                              </div>
                            )}
                            {item?.selected_cuts?.[0]?.name && (
                              <div className="cart-variant-info">
                                {item.selected_cuts[0].name}
                                {item.cut_price > 0 && (
                                  <> (₹{item.cut_price})</>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="sp-value">
                            <div className="qty-plus-minus">
                              <div
                                className="dec sp-qtybtn"
                                onClick={(e) => handleDecrease(e, item)}
                                aria-label="Decrease quantity"
                                disabled={isActionDisabled || decreaseCooldown}
                                style={{
                                  pointerEvents:
                                    isActionDisabled || decreaseCooldown
                                      ? "none"
                                      : "auto",
                                  opacity:
                                    isActionDisabled || decreaseCooldown ? 0.7 : 1,
                                }}
                              >
                                <i
                                  className="fa-solid fa-minus"
                                  style={{ fontSize: "12px" }}
                                ></i>
                              </div>
                              <input
                                className="qty-input"
                                type="text"
                                value={item?.quantity}
                                readOnly
                              />
                              <div
                                className="inc sp-qtybtn"
                                onClick={(e) => {
                                  if (isMaxReached) return;
                                  handleIncrease(e, item.id);
                                }}
                                aria-label="Increase quantity"
                                disabled={isActionDisabled || isMaxReached || increaseCooldown}
                                style={{
                                  pointerEvents:
                                    isActionDisabled ||
                                      isMaxReached ||
                                      increaseCooldown
                                      ? "none"
                                      : "auto",
                                  opacity:
                                    isActionDisabled ||
                                      isMaxReached ||
                                      increaseCooldown
                                      ? 0.7
                                      : 1,
                                }}
                              >
                                <i
                                  className="fa-solid fa-plus"
                                  style={{ fontSize: "12px" }}
                                ></i>
                              </div>
                            </div>
                            ₹<div className="sp-item-total">{item?.total}</div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* TOTALS */}
                <div className="sp-bottom-cart">
                  <div className="cart-sub-total">
                    <table className="table cart-table">
                      <tbody>
                        {/* <tr>
                          <td className="title">Subtotal :</td>
                          <td className="cart-total-price">
                            ₹{cart?.subtotal - cart?.total_tax}
                          </td>
                        </tr>
                        <tr>
                          <td className="title">GST ({cart?.tax_percentage}%) :</td>
                          <td className="price tax-price">₹{cart?.total_tax}</td>
                        </tr> */}
                        <tr>
                          <td className="title">Total :</td>
                          <td className="price grand-total">
                            ₹{cart?.subtotal}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {items.length > 0 && cartBottomPromotion?.title && (
                    <div className="cart-bottom-banner-container">
                      <div
                        className="cart-banner-wrapper d-lg-block d-none"
                        onClick={() =>
                          handleBannerClick(cartBottomPromotion?.link_url)
                        }
                      >
                        <img
                          src={cartBottomPromotion?.image_desktop}
                          alt="Special Offer"
                          className="cart-promo-banner-img"
                        />
                      </div>
                      <div
                        className="cart-banner-wrapper d-block d-lg-none"
                        onClick={() =>
                          handleBannerClick(cartBottomPromotion?.link_url)
                        }
                      >
                        <img
                          src={cartBottomPromotion?.image_mobile}
                          alt="Special Offer"
                          className="cart-promo-banner-img"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* FOOTER TOTAL */}
              <div
                className="cart-total-footer border-top overflow-hidden"
                style={{
                  position: "sticky",
                  bottom: 0,
                  marginLeft: "-20px", // adjust based on your container padding
                  marginRight: "-20px",
                  backgroundColor: "#fff",
                  zIndex: 10,
                  height: "50px",
                  borderBottomLeftRadius: "15px",
                }}
              >
                <div className="d-flex w-100 h-100">
                  <div className="d-flex align-items-center justify-content-between flex-grow-1 px-3 h-100">
                    <h6
                      className="mb-0 fw-semibold"
                      style={{ fontSize: "15px" }}
                    >
                      Total:{" "}
                      <span className="fw-semibold">₹{cart?.subtotal}</span>
                    </h6>
                  </div>

                  <div
                    className="d-flex align-items-center justify-content-center px-4 h-100"
                    style={{
                      backgroundColor: isBlocked ? "#A5A5A5" : "#DC4A3F",
                      cursor: isBlocked ? "not-allowed" : "pointer",
                      transition: "0.3s",
                    }}
                    onClick={navigateCheckout}
                  >
                    <div
                      className="text-white fw-semibold text-decoration-none"
                      style={{ fontSize: "12px" }}
                    >
                      Proceed to Checkout
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="fishlo-checkout-wrapper" style={{ minHeight: "0vh" }}>
        <LocationModal
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          onConfirm={handleMapConfirm}
          mapCenter={
            mapAddressData?.latitude && mapAddressData?.longitude
              ? {
                lat: parseFloat(mapAddressData.latitude),
                lng: parseFloat(mapAddressData.longitude),
              }
              : { lat: 19.0845, lng: 73.0084 } // Default fallback
          }
        />

        <AddressModal
          // key={mapAddressData?.id || "new-address"}
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          prefilledData={mapAddressData}
          onAddressCreatedOrUpdated={(id) => setSelectedAddressId(id)}
          shouldValidate={autoValidate}
          onSwitchToMap={switchToMapMode}
        />
      </div>
    </>
  );
}
