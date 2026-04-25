import { Bell, BellRing, MapPinPlus } from "lucide-react";
import { useGetDeliveryTime } from "../features/useAddress";
import { useProductActions } from "../hooks/useProductActions";

export default function CollectionCard({ product, setShowLocationModal }) {
  const { isInCart, cartItem, isNotifying, actions, status, isMaxReached } =
    useProductActions(product);
  const { data: deliveryData } = useGetDeliveryTime();
  const maxStock = parseFloat(product?.product_max_stock || 0);

  const hasCuts = product?.cuts?.length > 0;

  return (
    <>
      <div
        onClick={actions.handleDetailsPage}
        className="sp-collection-block"
        style={{ cursor: "pointer" }}
      >
        <div className="collection-detail">
          <div className="collection-img" style={{ position: "relative" }}>
            <img
              src={product?.featured_image}
              alt={product?.name}
              className={
                product?.isOutOfStock || !product?.isInDeliveryZone
                  ? "out-of-stock-saturation"
                  : ""
              }
            />

            {/* Out of Stock Badge Overlay */}
            {(product?.isOutOfStock || !product?.isInDeliveryZone) && (
              <span className="collection-out-of-stock-badge">
                {!product?.isInDeliveryZone
                  ? "Out of Delivery Zone"
                  : "OUT OF STOCK"}{" "}
              </span>
            )}

            <div className="cc-overlay">
              {!product?.isInDeliveryZone ? (
                <button
                  className="cc-btn-view"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLocationModal(true);
                  }}
                >
                  <MapPinPlus strokeWidth={1.75} />
                </button>
              ) : product?.isOutOfStock ? null : !product?.isPackedProduct ? (
                // <button
                //   className="cc-btn-view"
                //   onClick={actions.handleDetailsPage}
                // >
                //   <i className="ri-eye-line"></i>
                // </button>
                ""
              ) : isInCart ? (
                <div
                  className="cc-qty-box"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="cc-qty-btn minus"
                    onClick={actions.handleDec}
                    disabled={
                      status.isDecreasing ||
                      status.isRemoving ||
                      status.isAdding ||
                      status.isFetching
                    }
                    style={{
                      pointerEvents:
                        status.isDecreasing || status.isRemoving
                          ? "none"
                          : "auto",
                      opacity:
                        status.isDecreasing || status.isRemoving ? 0.7 : 1,
                    }}
                  >
                    <i className="fa-solid fa-minus"></i>
                  </button>
                  <span className="cc-qty-text">{cartItem.quantity}</span>
                  <button
                    className="cc-qty-btn plus"
                    onClick={actions.handleInc}
                    disabled={
                      status.isIncreasing ||
                      status.isAdding ||
                      status.isFetching ||
                      isMaxReached
                    }
                    style={{
                      pointerEvents:
                        status.isIncreasing || isMaxReached ? "none" : "auto",
                      opacity: status.isIncreasing || isMaxReached ? 0.7 : 1,
                    }}
                  >
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>
              ) : maxStock > 0 ? (
                <button
                  className="cc-add-btn"
                  onClick={actions.handleAdd}
                  disabled={status.isAdding}
                >
                  <i className="ri-add-line"></i>
                </button>
              ) : null}
            </div>
          </div>

          <div className="collection-info">
            <h5 className="collection-product-name line-clamp-2">
              {product?.name}
            </h5>

            {/* <div className="meta-text-row">
              <span>
                {product?.weight
                  ? `${parseFloat(product.weight)}${product.weight.replace(
                      /[0-9.]/g,
                      "",
                    )}`
                  : "N/A"}
              </span>

              <span className="meta-separator">|</span>
              <span>
                {product?.min_pieces}-{product?.max_pieces} Pieces
              </span>

              <span className="meta-separator">|</span>
              <span>
                Serves {product?.min_serves}-{product?.max_serves}
              </span>
            </div> */}

            <div className="price-block">
              <span className="price-current">
                ₹{product?.sell_type === 'WEIGHT' ? Math.round(product.display_price / 2) : product?.display_price}
                {product?.sell_type === 'WEIGHT' && <span style={{ fontSize: "0.8em" }}> /500g</span>}
              </span>
              {product?.regular_price && Number(product.display_price) !== Number(product.regular_price) && (
                <>
                  <span className="price-original">
                    ₹{product?.sell_type === 'WEIGHT' ? Math.round(product.regular_price / 2) : product?.regular_price}
                  </span>
                  {product?.discount_percentage > 0 && (
                    <span className="price-discount">
                      {product.discount_percentage}% off
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Limit Error Removed */}

            {!product?.isInDeliveryZone ? (
              <div className="delivery-info out-of-zone">
                <i className="ri-map-pin-warning-line delivery-icon"></i>
                <span style={{ color: "#d7574c", fontWeight: "400" }}>
                  Not deliverable to your location
                </span>
              </div>
            ) : product?.isOutOfStock ? (
              <div className="collection-notify-footer">
                <span className="collection-notify-text">
                  {product?.isStockNotified
                    ? "We will notify you!"
                    : "Get notified when available"}
                </span>
                <button
                  className="collection-btn-notify-me"
                  onClick={actions.handleNotify}
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
              <div className="delivery-info">
                <i className="ri-flashlight-fill delivery-icon"></i>
                <span>
                  {deliveryData?.message}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
