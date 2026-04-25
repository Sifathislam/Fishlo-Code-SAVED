import { MapPinPlus, Bell, BellRing } from "lucide-react";
import { useGetDeliveryTime } from "../features/useAddress";
import { useLocationManager } from "../hooks/useLocationManager";
import { useProductActions } from "../hooks/useProductActions";
import LocationModal from "./LocationModal";

const FeaturedItem = ({ item, viewed }) => {
  const {
    showLocationModal,
    setShowLocationModal,
    mapCenter,
    handleLocationConfirm,
  } = useLocationManager();
  const { isInCart, cartItem, isNotifying, actions, status, isMaxReached } =
    useProductActions(item);
  const { data: deliveryData } = useGetDeliveryTime();
  const maxStock = parseFloat(item?.product_max_stock || 0);
  const hasCuts = item?.cuts?.length > 0;

  return (
    <>
      {showLocationModal && (
        <LocationModal
          isOpen={showLocationModal}
          mapCenter={mapCenter}
          onClose={() => setShowLocationModal(false)}
          onConfirm={handleLocationConfirm}
        />
      )}
      <div className="sp-product-box" onClick={actions.handleDetailsPage}>
        <div className="sp-product-card">
          <div className="sp-pro-box m-0">
            <div className="sp-pro-img relative-position overflow-visible">
              <div
                className="inner-img"
                onClick={(e) => {
                  e.preventDefault();
                  actions.handleDetailsPage();
                }}
                style={{ cursor: "pointer" }}
              >
                <img
                  className={`main-img sp-product-img ${
                    item?.isOutOfStock || !item?.isInDeliveryZone
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
                {(item?.isOutOfStock || !item?.isInDeliveryZone) && (
                  <span className="out-of-stock-badge">
                    {!item?.isInDeliveryZone
                      ? "OUT OF DELIVERY ZONE"
                      : "OUT OF STOCK"}
                  </span>
                )}
                {viewed && (
                  <div className="viewed-label-wrapper">
                    <i className="ri-eye-line"></i>
                    <span>Viewed</span>
                  </div>
                )}
              </div>

              <div className="img-overlay-btn edge-position">
                {!item?.isInDeliveryZone ? (
                  <button
                    className="btn-icon-add btn-view"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLocationModal(true);
                    }}
                  >
                    <MapPinPlus size={18} strokeWidth={1.75} />
                  </button>
                ) : item?.isOutOfStock ? null : !item?.isPackedProduct ? (
                  // <button
                  //   className="btn-icon-add btn-view"
                  //   onClick={actions.handleDetailsPage}
                  // >
                  //   <i className="ri-eye-line"></i>
                  // </button>
                  ""
                ) : isInCart ? (
                  <div
                    className="qty-counter-overlay"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="qty-btn-overlay minus"
                      onClick={actions.handleDec}
                      disabled={
                        status.isDecreasing ||
                        status.isRemoving ||
                        status.isAdding ||
                        status.isFetching
                      }
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
                          status.isIncreasing ||
                          status.isFetching ||
                          isMaxReached
                            ? "none"
                            : "auto",
                        opacity: status.isIncreasing || isMaxReached ? 0.7 : 1,
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

            <div className="sp-pro-details">
              <h4 className="featured-sp-pro-title">
                <a
                  href="javascript:void(0)"
                  onClick={(e) => {
                    e.preventDefault();
                    actions.handleDetailsPage();
                  }}
                >
                  {item?.name}
                </a>
              </h4>
              {item?.sell_type === "PACK" && (
                <div className="featured-meta-text-row">
                  <span>
                    {item?.sell_type === "PACK" && item?.pack_weight_kg
                      ? item.pack_weight_kg >= 1
                        ? `${parseFloat(item?.pack_weight_kg)}kg`
                        : `${parseFloat(item?.pack_weight_kg) * 1000}g`
                      : item?.weight
                        ? `${parseFloat(item.weight)}${item?.weight.replace(
                            /[0-9.]/g,
                            "",
                          )}`
                        : "N/A"}
                  </span>
                  {(item?.min_pieces > 0 || item?.max_pieces > 0) && (
                    <span className="featured-meta-separator">|</span>
                  )}

                  {/* 1. Pieces Logic: Only show if min OR max exists */}
                  {(item?.min_pieces > 0 || item?.max_pieces > 0) && (
                    <span>
                      {item?.min_pieces}
                      {item?.min_pieces && item?.max_pieces && "-"}
                      {item?.max_pieces} Pieces
                    </span>
                  )}

                  {/* 2. Separator Logic: Only show if we have BOTH Pieces data AND Serves data */}
                  {(item?.min_serves > 0 || item?.max_serves > 0) && (
                    <span className="featured-meta-separator">|</span>
                  )}

                  {/* 3. Serves Logic: Only show if min OR max exists */}
                  {(item?.min_serves > 0 || item?.max_serves > 0) && (
                    <span>
                      Serves {item?.min_serves}
                      {item?.min_serves && item?.max_serves && "-"}
                      {item?.max_serves}
                    </span>
                  )}
                </div>
              )}
              <div className="price-block">
                <div className="featured-price-block">
                  <span className="featured-price-current">
                    ₹{item?.sell_type === "WEIGHT" ? Math.round(item.display_price / 2) : item?.display_price}
                    {item?.sell_type === "WEIGHT" ? <span style={{ fontSize: "0.8em" }}> /500g</span> : ""}
                  </span>
                  {item?.regular_price &&
                    Number(item.display_price) !==
                      Number(item.regular_price) && (
                      <>
                        <span className="featured-price-original">
                          ₹{item?.sell_type === "WEIGHT" ? Math.round(item.regular_price / 2) : item?.regular_price}
                        </span>
                        {item?.discount_percentage > 0 && (
                          <span className="featured-price-discount">
                            {item?.discount_percentage}% off
                          </span>
                        )}
                      </>
                    )}
                </div>
              </div>

              {/* Limit Error Removed */}

              {!item?.isInDeliveryZone ? (
                <div className="featured-delivery-info">
                  <i
                    className="ri-map-pin-warning-line delivery-icon"
                    style={{ color: "#d7574c" }}
                  ></i>
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
                    className="btn-notify-me"
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
                <div className="featured-delivery-info">
                  <i className="ri-flashlight-fill delivery-icon"></i>
                  <span>{deliveryData?.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default FeaturedItem;
