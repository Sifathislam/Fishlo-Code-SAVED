import { useProducts } from "../../features/useProduct";
import FeaturedProductCard from "../FeaturedProductCard";

export default function FeatureCollection() {
  const { data, isPending, isError, error } = useProducts();

  return (
    <section
      className="sp-product-tab sp-products padding-tb-50"
    >
      <div className="container">
        <div className="row mb-3">
          <div className="section-detail  mb-2 mb-lg-3">
            <div className="sp-title">
              <h2 data-cursor="big">Fishlo’s Signature Seafood</h2>
              <p>A curated collection of our finest, premium-grade seafood.</p>
            </div>
          </div>
        </div>
        {/* New Product */}
        <FeaturedProductCard
          data={data}
          isLoading={isPending}
          isError={isError}
          page={"home"}
        />
      </div>
    </section>
  );
}
