import { useGetCart } from "../../features/useCart";
import { useLocationManager } from "../../hooks/useLocationManager";
import useStateHooks from "../../shared/hooks/useStateHooks";
import LocationModal from "../LocationModal";
import Loader from "../../shared/components/Loader";
import PopularSearches from "./PopularSearches";
import SearchProductCard from "./SearchCard";

export default function Search({
  data: productsData,
  isProductsLoading,
  setSearch,
}) {
  const {
    showLocationModal,
    setShowLocationModal,
    mapCenter,
    handleLocationConfirm,
  } = useLocationManager();
  const { data: cart } = useGetCart();
  const { setCartOpen } = useStateHooks();

  const handleUpdateCart = (productId, cutIndex, delta) => {
    const cartId = `${productId}_${cutIndex}`;
  };

  // if (isProductsLoading) {
  //   return (
  //     <div
  //       className="vh-100 d-flex align-items-center justify-content-center"
  //       style={{ marginTop: "-120px" }}
  //     >
  //       <Loader />
  //     </div>
  //   );
  // }

  //  console.log(productsData);
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

      <div className="fishlo-search min-vh-100">
        {/* --- Main Content --- */}
        <div className="fishlo-container pb-5">
          <div className="d-none d-lg-block">
            <PopularSearches setSearch={setSearch} />
            <div className="page-header">
              <h4 className="m-0 fw-medium">Search Results</h4>
              <span className="results-info">
                {productsData?.length === 0
                  ? "0 Items"
                  : `${productsData?.length || 0} Items`}
              </span>
            </div>
          </div>

          {/* Product Grid */}
          {isProductsLoading ? (
            <div
              className="vh-100 d-flex align-items-center justify-content-center"
              style={{ marginTop: "-220px" }}
            >
              <Loader />
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-lg-2 g-4">
              {productsData
                ?.slice() // Create a copy first
                .sort((a, b) => Number(a.isOutOfStock) - Number(b.isOutOfStock)) // Sort: false (0) comes before true (1)
                .map((product) => (
                  <SearchProductCard
                    key={product?.id}
                    product={product}
                    cart={cart}
                    onUpdateCart={handleUpdateCart}
                    setShowLocationModal={setShowLocationModal}
                  />
                ))}
            </div>
          )}

          {/* Empty State */}
          {productsData?.length === 0 && (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="fas fa-search fa-3x text-secondary opacity-25"></i>
              </div>
              <h5 className="text-secondary fw-medium">No products found</h5>
              {/* <p className="text-muted small">
              Try searching for 'Salmon' or 'Beef'
            </p> */}
            </div>
          )}
        </div>

        {/* --- Sticky Cart Summary --- */}
        {cart?.items_count > 0 && (
          <div
            className="cart-summary accent-gradient"
            onClick={() => setCartOpen(true)}
            style={{ display: "flex" }}
          >
            <div>
              <span>{cart?.items_count}</span> Items &nbsp;
              <span style={{ opacity: 0.5 }}>|</span>&nbsp;{" "}
              <span>₹{cart?.subtotal}</span>
            </div>
            <div className="d-flex align-items-center">
              View Cart
              <i
                className="fas fa-chevron-right ms-2"
                style={{ fontSize: "0.8rem" }}
              ></i>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
