import { useRecentlyViewedProducts } from "../../features/useProduct";
import FeaturedProductCard from "../FeaturedProductCard";

export default function RecentView() {
  const { data, isLoading, isError, error } = useRecentlyViewedProducts();

  const isEmpty =
    !isLoading && (!data || !data.results || data.results.length === 0);

  if (isEmpty) {
    return null;
  }

  return (
    <section className="sp-product-tab sp-products padding-tb-50">
      <div className="container">
        <div className="row mb-4 justify-content-center">
          <div className="col-lg-8 text-center">
            <div className="recent-section-detail detail-two">
              <div className="sp-title">
                <h2 data-cursor="big">Recently Viewed</h2>
                <p>
                  Pick up where you left off and take another look at your
                  favorites.
                </p>
              </div>
            </div>
          </div>
        </div>

        <FeaturedProductCard
          data={data}
          isLoading={isLoading}
          isError={isError}
          page={"home"}
          viewed={true}
        />
      </div>
    </section>
  );
}
