import { MapPinPlus, Bell, BellRing } from "lucide-react";
import { useGetDeliveryTime } from "../../features/useAddress";
import { useProductActions } from "../../hooks/useProductActions";

const MasalaItem = ({ item, setShowLocationModal }) => {
  const { isInCart, cartItem, isNotifying, actions, status, isMaxReached } =
    useProductActions(item);
  const { data: deliveryData } = useGetDeliveryTime();

  const hasCuts = item?.cuts?.length > 0;
  const isDeliverable = item?.isInDeliveryZone;
  const maxStock = parseFloat(item?.product_max_stock || 0);

  // console.log("item", item);

  return (
    <div onClick={actions.handleDetailsPage} className="sp-product-box">
      <div className="sp-product-card">
        <div className="sp-pro-box m-0">
          {/* ==== PRODUCT IMAGE ==== */}
          <div className="sp-pro-img relative-position overflow-visible">
            <a href="javascript:void(0)">
              <div className="inner-img">
                <img
                  className={`main-img sp-product-img ${
                    item?.isOutOfStock || !isDeliverable
                      ? "out-of-stock-saturation"
                      : ""
                  }`}
                  src={item?.featured_image}
                  alt={item?.name}
                />
                <img
                  className="hover-img"
                  src={item?.featured_image}
                  alt={item?.name}
                />
                {(item?.isOutOfStock || !isDeliverable) && (
                  <span className="out-of-stock-badge">
                    {!isDeliverable ? "Out of Delivery Zone" : "OUT OF STOCK"}
                  </span>
                )}
              </div>
            </a>

            {/* ==== OVERLAY ACTION BUTTON ==== */}
            <div className="img-overlay-btn edge-position">
              {!isDeliverable ? (
                /*  Out of Delivery Zone - Map Pin */
                <button
                  type="button"
                  className="btn-icon-add btn-view"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLocationModal(true);
                  }}
                >
                  <MapPinPlus size={18} strokeWidth={1.75} />
                </button>
              ) : item?.isOutOfStock /* In Zone, but Out of Stock - No Overlay buttons */ ? null : !item?.isPackedProduct ? (
                /*  Customizable - Eye Icon */
                // <button type="button" className="btn-icon-add btn-view">
                //   <i className="ri-eye-line"></i>
                // </button>
                ""
              ) : isInCart ? (
                /*  In Cart - Qty Controls */
                <div
                  className="qty-counter-overlay"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="qty-btn-overlay minus"
                    onClick={actions.handleDec}
                    style={{
                      pointerEvents:
                        status.isRemoving ||
                        status.isAdding ||
                        status.decreaseCooldown ||
                        status.isOptimistic
                          ? "none"
                          : "auto",
                      opacity:
                        status.isRemoving ||
                        status.isAdding ||
                        status.decreaseCooldown ||
                        status.isOptimistic
                          ? 0.7
                          : 1,
                    }}
                  >
                    <i className="fa-solid fa-minus"></i>
                  </button>
                  <span className="qty-val-overlay">{cartItem.quantity}</span>
                  <button
                    type="button"
                    className="qty-btn-overlay plus"
                    onClick={actions.handleInc}
                    style={{
                      pointerEvents:
                        isMaxReached ||
                        status.isAdding ||
                        status.increaseCooldown ||
                        status.isOptimistic
                          ? "none"
                          : "auto",
                      opacity:
                        isMaxReached ||
                        status.isAdding ||
                        status.increaseCooldown ||
                        status.isOptimistic
                          ? 0.7
                          : 1,
                    }}
                  >
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>
              ) : maxStock > 0 ? (
                /*  Default Add Button */
                <button
                  type="button"
                  className="btn-icon-add"
                  onClick={actions.handleAdd}
                  disabled={status.isAdding}
                >
                  <i className="ri-add-line fs-3"></i>
                </button>
              ) : null}
            </div>
          </div>

          {/* ===== PRODUCT DETAILS ===== */}
          <div className="sp-pro-details">
            <h4
              className="masala-featured-sp-pro-title"
              style={{ cursor: "pointer" }}
            >
              <a className="">{item?.name}</a>
            </h4>
            <div className="masala-featured-meta-text-row">
              <span>{item?.short_description}</span>
            </div>

            <div className="price-block">
              <div className="featured-price-block">
                <span className="masala-featured-price-current">
                  ₹{item?.sell_type === "WEIGHT" ? Math.round(item.display_price / 2) : item?.display_price}
                  {item?.sell_type === "WEIGHT" ? <span style={{ fontSize: "0.8em" }}> /500g</span> : ""}
                </span>
                {item?.regular_price &&
                  Number(item?.display_price) !==
                    Number(item?.regular_price) && (
                    <>
                      <span className="masala-featured-price-original">
                        ₹{item?.sell_type === "WEIGHT" ? Math.round(item.regular_price / 2) : item?.regular_price}
                      </span>
                      {item?.discount_percentage > 0 && (
                        <span className="masala-featured-price-discount">
                          {item?.discount_percentage}% off
                        </span>
                      )}
                    </>
                  )}
              </div>
            </div>

            {/* Limit Error Removed */}

            {!isDeliverable ? (
              /*  Outside delivery zone */
              <div className="masala-featured-delivery-info text-danger">
                <i className="ri-map-pin-warning-line delivery-icon"></i>
                <span style={{ color: "#d7574c", fontWeight: "400" }}>
                  Not deliverable to your location
                </span>
              </div>
            ) : item?.isOutOfStock ? (
              <div className="notify-footer">
                <span className="notify-text">
                  {item?.isStockNotified
                    ? "We will notify you!"
                    : "Get notified when available"}
                </span>
                <button
                  type="button"
                  className="single-btn-notify-me"
                  onClick={actions.handleNotify}
                  disabled={isNotifying || item?.isStockNotified}
                >
                  {item?.isStockNotified ? "Notified" : "Notify"}
                  {item?.isStockNotified ? (
                    <BellRing size={14} color="#27ae60" fill="#27ae60" />
                  ) : (
                    <Bell size={14} color="#d7574c" fill="#d7574c" />
                  )}
                </button>

              </div>
            ) : (
              <div className="masala-featured-delivery-info">
                <i className="ri-flashlight-fill delivery-icon"></i>
                <span>{deliveryData?.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasalaItem;
