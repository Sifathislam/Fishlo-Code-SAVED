import MasalaItem from "./MasalaItem";

export default function SingleProductCard({
  data,
  setShowLocationModal,
  addons,
  fish,
}) {
  const products = data?.results ?? [];

  //  Filter and Sort Logic
  const displayProducts = products
    .filter((product) => {
      // 1. Must be available
      if (!product.is_available) return false;
      // 2. If 'fish' is true, do not show out of stock products
      if (fish && product.isOutOfStock) return false;
      
      return true;
    })
    .sort((a, b) => Number(a.isOutOfStock) - Number(b.isOutOfStock))
    // 3. Limit to 4 if 'fish' is true, otherwise keep the 11 limit
    .slice(0, fish ? 4 : 11);

  if (!displayProducts.length) return null;

  return (
    <div className="row mtb-minus-12">
      <div className="tab-content">
        <div className="tab-pane fade show active">
          <div
            className={
              addons === "addons"
                ? "addons-product-slider-grid"
                : fish
                  ? "checkout-right-sp-product-slider-grid"
                  : "sp-product-slider-grid"
            }
          >
            {displayProducts.map((item) => (
              <MasalaItem
                key={item.id}
                setShowLocationModal={setShowLocationModal}
                item={item}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
