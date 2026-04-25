import FeaturedItem from "../FeaturedCard";
import FeaturedProductCardSkeleton from "../FeaturedProductCardSkeleton";
import { Link } from "react-router-dom";

export default function FreshCutsCard({ data, isLoading = false, viewed = false }) {
  const products = data?.results ?? [];

  const packProducts = products.filter(
    (product) => 
      product.is_available && 
      product.isPackedProduct && 
      product?.category?.slug?.toLowerCase() !== "masala" &&
      product?.category?.name?.toLowerCase() !== "masala" &&
      product?.category !== "masala"
  );

  const displayProducts = packProducts
    .sort((a, b) => Number(a.isOutOfStock) - Number(b.isOutOfStock))
    .slice(0, 4);

  return (
    <div className="row mtb-minus-12">
      <div className="tab-content">
        <div className="tab-pane fade show active">
          <div className="sp-product-slider-grid">
            {isLoading ? (
              <FeaturedProductCardSkeleton cards={4} />
            ) : (
              <>
                {displayProducts.map((item) => (
                  <FeaturedItem key={item.id} item={item} viewed={viewed} />
                ))}

                {packProducts.length > 5 && (
                  <div className="sp-product-box">
                    <Link to="/all-products?type=packed" className="sp-product-card view-all-card" style={{ textDecoration: 'none' }}>
                      <div className="view-all-content">
                        <span className="view-all-text">View All</span>
                        <span className="view-all-sub">Browse all items</span>
                        <div className="view-all-icon">
                          <i className="ri-arrow-right-line"></i>
                        </div>
                      </div>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
