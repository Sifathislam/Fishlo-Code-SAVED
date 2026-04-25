import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const ProductCatalog = ({
  mockProducts,
  mockCategories,
  selectedCategory,
  setSelectedCategory,
  onAddToCart,
  isLoading,
  isCategoriesLoading,
  cart,
  updateQuantity,
  checkStockLimit,
}) => {
  return (
    <div className="col-lg-8 h-100 overflow-auto p-3 p-lg-4 custom-scrollbar pb-5 mb-5 mb-lg-0">
      {/* Categories */}
      <div className="mb-4 overflow-x-auto pb-2 category-scroll">
        <div className="d-flex gap-2">
          {isCategoriesLoading ? (
            Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} width={80} height={32} borderRadius={20} />
            ))
          ) : (
            mockCategories.map((cat) => (
              <button
                key={cat.id || cat}
                onClick={() => setSelectedCategory(cat.slug || cat)}
                className={`btn rounded-pill px-3 py-1 fw-medium transition-all small ${selectedCategory === (cat.slug || cat) ? "sd-btn-primary text-white shadow-soft" : "bg-white border text-secondary hover-bg-gray"}`}
                style={{ whiteSpace: "nowrap", fontSize: "0.85rem" }}
              >
                {cat.name || cat}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="row g-2">
        {isLoading
          ? Array(10)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="col-6 col-md-4 col-lg-3 col-xl-20 col-xxl-20"
              >
                <div className="card h-100 border-0 shadow-sm rounded-3 overflow-hidden bg-white">
                  <div className="ratio ratio-4x3 bg-light">
                    <Skeleton height="100%" />
                  </div>
                  <div className="card-body p-2 d-flex flex-column justify-content-between">
                    <div>
                      <Skeleton count={1} height={20} className="mb-1" />
                      <Skeleton count={1} width={40} height={15} />
                    </div>
                    <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-light border-opacity-50">
                      <Skeleton width={50} height={20} />
                      <Skeleton circle width={28} height={28} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          : mockProducts.map((product) => (
            <div
              key={product.id}
              className="col-6 col-md-4 col-lg-3 col-xl-20 col-xxl-20"
            >
              <div
                className={`card h-100 border-0 shadow-sm rounded-3 overflow-hidden product-card group bg-white ${!product.isOutOfStock ? "cursor-pointer" : ""}`}
                onClick={() => !product.isOutOfStock && onAddToCart(product)}
              >
                {/* Image Container with Out of Stock Overlay */}
                <div
                  className={`ratio ratio-4x3 bg-light position-relative overflow-hidden ${product.isOutOfStock ? "opacity-75" : ""}`}
                >
                  <img
                    src={
                      product.image ||
                      "https://placehold.co/300x200?text=No+Image"
                    }
                    className={`card-img-top object-fit-cover ${product.isOutOfStock ? "opacity-50 grayscale" : ""}`}
                    alt={product.name}
                  />
                  {product.isOutOfStock && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                      <span className="badge bg-danger rounded-pill px-3 py-2 shadow-sm">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="card-body p-2 d-flex flex-column justify-content-between">
                  <div>
                    <h6
                      className="fw-medium text-dark mb-1 small"
                      title={product.name}
                      style={{
                        display: "block",         
                        overflow: "visible",     
                        lineHeight: "1.2",
                        height: "auto",          
                        wordBreak: "break-word"   
                      }}
                    >
                      {product.name}
                    </h6>
                    {/* Unit/Weight Removed as per request */}
                  </div>

                  <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-light border-opacity-50">
                    <div
                      className={`fw-medium small d-flex align-items-center flex-wrap ${product.isOutOfStock ? "text-muted text-decoration-line-through" : "text-dark"}`}
                    >
                      <span className="me-1">₹{product.price}{product.sell_type === 'WEIGHT' ? ' /kg' : ''}</span>
                      {product.regular_price && Number(product.price) !== Number(product.regular_price) && (
                        <span className="text-muted text-decoration-line-through mx-1" style={{ fontSize: '0.8rem' }}>
                          ₹{product.regular_price}
                        </span>
                      )}
                      {product.discount_percentage > 0 && (
                        <span className="text-success ms-1" style={{ fontSize: '0.75rem' }}>
                          {product.discount_percentage}% off
                        </span>
                      )}
                    </div>
                    {!product.isOutOfStock && (
                      (() => {
                        // Calculate total quantity for this product in cart
                        const cartItems = cart ? cart.filter(item => item.id === product.id && product.isPackedProduct) : [];
                        const totalQty = cartItems.reduce((acc, item) => acc + item.quantity, 0);

                        if (totalQty > 0) {
                          return (
                            <div className="d-flex align-items-center bg-light rounded-pill border px-1" style={{ height: "28px" }}>
                              <button
                                className="btn btn-sm btn-link text-dark p-0 px-2 text-decoration-none"
                                style={{ fontSize: "1rem", lineHeight: 1 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Find the first item to decrease
                                  const itemToDecrease = cartItems[cartItems.length - 1]; // Decrease the last added one naturally
                                  if (itemToDecrease) {
                                    updateQuantity(itemToDecrease.cartItemId, -1);
                                  }
                                }}
                              >
                                −
                              </button>
                              <span className="fw-medium px-1 small" style={{ minWidth: "20px", textAlign: "center" }}>
                                {totalQty}
                              </span>
                              <button
                                className={`btn btn-sm btn-link text-dark p-0 px-2 text-decoration-none ${product.isPackedProduct && !checkStockLimit(product, 1).allowed
                                  ? "opacity-25"
                                  : ""
                                  }`}
                                style={{
                                  fontSize: "1rem",
                                  lineHeight: 1,
                                  cursor:
                                    product.isPackedProduct && !checkStockLimit(product, 1).allowed
                                      ? "not-allowed"
                                      : "pointer",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (
                                    product.isPackedProduct &&
                                    !checkStockLimit(product, 1).allowed
                                  )
                                    return;
                                  onAddToCart(product);
                                }}
                              >
                                +
                              </button>
                            </div>
                          );
                        }

                        return (
                          <button
                            className="btn sd-btn-primary rounded-circle shadow-sm d-flex align-items-center justify-content-center transition-all group-hover-scale p-0"
                            style={{ width: 28, height: 28 }}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click
                              onAddToCart(product);
                            }}
                          >
                            <i className="bi bi-plus text-white"></i>
                          </button>
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ProductCatalog;
