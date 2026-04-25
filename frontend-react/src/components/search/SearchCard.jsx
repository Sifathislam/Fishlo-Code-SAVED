import { MapPinPlus, Bell, BellRing } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAddToCart,
  useDecreaseQty,
  useIncreaseQty,
  useRemoveCartItem,
} from "../../features/useCart";
import { useStockNotify } from "../../features/useStockNotify";
import useAuth from "../../hooks/useAuth";
import useStateHooks from "../../shared/hooks/useStateHooks";

export default function SearchProductCard({
  product,
  cart,
  setShowLocationModal,
}) {
  const addToCart = useAddToCart();
  const increaseQty = useIncreaseQty();
  const decreaseQty = useDecreaseQty();
  const removeItem = useRemoveCartItem();
  const isProcessing = decreaseQty.isPending || removeItem.isPending;
  const { setOpenLogin } = useStateHooks();
  const { auth } = useAuth();
  const { notifyStock, isNotifying, notifyError } = useStockNotify();
  const navigate = useNavigate();

  const isDeliverable = product?.isInDeliveryZone;
  const isOutOfStock = product?.isOutOfStock;
  const hasCuts = Array.isArray(product?.cuts) && product.cuts.length > 0;

  const [selectedCutId, setSelectedCutId] = useState(() => {
    if (hasCuts) {
      return product.cuts[0].id;
    }
    return null;
  });
  const [waitingForCartUpdate, setWaitingForCartUpdate] = useState(false);

  const matchingCartItem = useMemo(() => {
    // Safely return if product or cart is missing
    if (!product || !cart?.items?.length) return undefined;

    return cart.items.find((it) => {
      if (it.product_id !== product.id) return false;

      const itemCutIds = (it.selected_cuts || []).map((c) => {
        if (c && typeof c === "object" && "id" in c) return c.id;
        return c;
      });

      if (hasCuts) {
        return itemCutIds.some((cid) => cid == selectedCutId);
      } else {
        return itemCutIds.length === 0;
      }
    });
  }, [cart, product, hasCuts, selectedCutId]);
  useEffect(() => {
    if (matchingCartItem) {
      setWaitingForCartUpdate(false);
    }
  }, [matchingCartItem]);

  // Also reset if the user changes the cut selection, so we don't show a fake state for the wrong cut
  useEffect(() => {
    setWaitingForCartUpdate(false);
  }, [selectedCutId]);

  if (!product) return null;

  // Logic: Show quantity if in cart OR if we are waiting for it to appear
  const quantityInCart =
    matchingCartItem?.quantity ?? (waitingForCartUpdate ? 1 : 0);

  if (!product) return null;

  const handleAdd = () => {
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
      console.warn("Cannot add weighted product without weight");
      return;
    }

    const body = {
      product_id: product.id,
      quantity: 1,
      cart_id: currentCartId ? currentCartId : null,
      product_weight_id: defaultWeightId,
    };

    if (hasCuts && selectedCutId != null) {
      body.cut_ids = selectedCutId;
    }

    // 1. Turn on the "Bridge" state immediately
    setWaitingForCartUpdate(true);

    addToCart.mutate(body, {
      onError: () => {
        setWaitingForCartUpdate(false);
      },
    });
  };

  const handleIncrease = () => {
    if (!matchingCartItem) return handleAdd();
    if (
      product?.product_max_stock != null &&
      matchingCartItem.quantity >= product.product_max_stock
    ) {
      return; // Do nothing
    }
    const currentCartId = localStorage.getItem("cart_id");
    increaseQty.mutate({ id: matchingCartItem.id, cartId: currentCartId });
  };

  const handleDecrease = () => {
    if (!matchingCartItem) return;
    const currentCartId = localStorage.getItem("cart_id");
    if (matchingCartItem.quantity <= 1) {
      removeItem.mutate({ id: matchingCartItem.id, cartId: currentCartId });
    } else {
      decreaseQty.mutate({ id: matchingCartItem.id, cartId: currentCartId });
    }
  };
  const handleNotify = (e, item) => {
    e.stopPropagation();
    if (item?.isStockNotified) return;
    if (!auth?.authToken) {
      setOpenLogin(true);
    } else {
      notifyStock({ product: item?.id });
    }
  };
  const handleCardClick = (e) => {
    // Check if user is selecting text
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      return; // Do nothing if text is selected
    }
    navigate(`/${product?.slug}`);
  };

  return (
    <div className="col g-3">
      <div
        className={`product-card-horizontal ${isOutOfStock ? "is-oos" : ""}`}
        onClick={handleCardClick}
        style={{ cursor: "pointer" }}
      >
        <div
          className={`pc-img-wrapper ${isOutOfStock || !isDeliverable ? "" : ""
            // isOutOfStock || !isDeliverable ? "oos" : ""
            }`}
        >
          {(isOutOfStock || !isDeliverable) && (
            <div className="oos-badge">
              {!isDeliverable ? "Out of Delivery Zone" : "OUT OF STOCK"}
            </div>
          )}
          <img src={product.image} alt={product.name} className="pc-img" />
        </div>

        <div className={`pc-content ${isOutOfStock ? "oos-content" : ""}`}>
          <div>
            <h6 className="pc-title">{product.name}</h6>
          </div>

          <div className="pc-footer">
            <div className="pc-price">
              {/* Main Display Price */}
              <div className="main-price">
                {product?.display_price != null ? (
                  <>
                    ₹{product?.sell_type === "WEIGHT" ? Math.round(Number(product.display_price) / 2).toFixed(2) : Number(product.display_price).toFixed(2)}
                    {product?.sell_type === "WEIGHT" && <span style={{ fontSize: "0.8em" }}> /500g</span>}
                  </>
                ) : null}
              </div>

              {/* Discount Info on Second Line */}
              {product?.regular_price != null &&
                Number(product.display_price) !==
                Number(product.regular_price) && (
                  <div
                    className="discount-row"
                    style={{ display: "block", marginTop: "2px" }}
                  >
                    <small
                      style={{ textDecoration: "line-through", color: "#777" }}
                    >
                      ₹{product?.sell_type === "WEIGHT" ? Math.round(Number(product.regular_price) / 2).toFixed(2) : Number(product.regular_price).toFixed(2)}
                    </small>

                    {product?.discount_percentage > 0 && (
                      <span
                        className="price-discount ms-1"
                        style={{ color: "#27ae60", fontSize: "0.8rem" }}
                      >
                        ({product.discount_percentage}% off)
                      </span>
                    )}
                  </div>
                )}
            </div>

            <div className="action-area">
              {/*  Switch between Action Buttons and Notify Button */}
              {!isDeliverable ? (
                /* CASE 1: Not Deliverable - Show Location Icon Button */
                <button
                  className="btn-add d-flex align-items-center justify-content-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLocationModal(true);
                  }}
                >
                  <MapPinPlus size={16} />
                </button>
              ) : isOutOfStock ? (
                <>
                  <button
                    className="btn-notify"
                    onClick={(e) => handleNotify(e, product)}
                    disabled={isNotifying || product?.isStockNotified}
                  >
                    {product?.isStockNotified ? (
                      <>
                        <span className="notify-text-desktop d-none d-lg-block">
                          We will notify you!
                        </span>
                        <span className="notify-text-mobile d-block d-lg-none">
                          Notified!
                        </span>
                        <BellRing
                          size={14}
                          color="#27ae60"
                          fill="#27ae60"
                          className="ms-1"
                        />
                      </>
                    ) : (
                      <>
                        <span className="notify-text-desktop d-none d-lg-block">
                          Get notified when available
                        </span>
                        <span className="notify-text-mobile d-block d-lg-none">
                          Notify Me
                        </span>
                        <Bell size={14} className="ms-1" />
                      </>
                    )}
                  </button>

                </>
              ) : (
                // Existing Add/Counter Logic
                (product?.isPackedProduct ||
                  product?.sell_type !== "WEIGHT") && (
                  <>
                    {quantityInCart === 0 ? (
                      <button
                        className="btn-add"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdd(e);
                        }}
                      >
                        ADD
                        <i
                          className="fas fa-plus ms-1"
                          style={{ fontSize: "0.7rem" }}
                        />
                      </button>
                    ) : (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="qty-counter"
                      >
                        <button
                          className="qty-btn"
                          // onClick={handleDecrease}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDecrease(e);
                          }}
                          style={{
                            pointerEvents:
                              isProcessing ||
                                waitingForCartUpdate ||
                                addToCart.isPending
                                ? "none"
                                : "auto",
                            opacity:
                              isProcessing ||
                                waitingForCartUpdate ||
                                addToCart.isPending
                                ? 0.7
                                : 1,
                          }}
                        >
                          <i className="fas fa-minus" />
                        </button>

                        <span className="qty-val">
                          {addToCart.isPending ? (
                            <i
                              className="fas fa-spinner fa-spin"
                              style={{ fontSize: "0.8rem" }}
                            />
                          ) : (
                            quantityInCart
                          )}
                        </span>

                        <button
                          className="qty-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIncrease(e);
                          }}
                          style={{
                            pointerEvents:
                              increaseQty.isPending ||
                                waitingForCartUpdate ||
                                addToCart.isPending ||
                                (product?.product_max_stock != null &&
                                  quantityInCart >= product.product_max_stock)
                                ? "none"
                                : "auto",
                            opacity:
                              increaseQty.isPending ||
                                waitingForCartUpdate ||
                                addToCart.isPending ||
                                (product?.product_max_stock != null &&
                                  quantityInCart >= product.product_max_stock)
                                ? 0.7
                                : 1,
                          }}
                        >
                          <i className="fas fa-plus" />
                        </button>
                      </div>
                    )}
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
