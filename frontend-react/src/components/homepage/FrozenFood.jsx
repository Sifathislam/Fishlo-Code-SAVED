import { useProducts } from "../../features/useProduct";
import FrozenFoodCard from "./FrozenFoodCard";

export default function FrozenFood() {
  const { data, isPending, isError } = useProducts("frozen-sea-fish");

  if (!isPending && data?.results?.length === 0) return null;

  return (
    <section
      className="sp-product-tab sp-products padding-tb-50 pt-0"
    >
      <div className="container">
        <div className="row mb-3">
          <div className="section-detail mb-2 mb-lg-5">
            <div className="sp-title">
              <h2 data-cursor="big">Frozen Foods</h2>
              <p>Explore our premium frozen selection!</p>
            </div>
          </div>
        </div>
        <FrozenFoodCard
          data={data}
          isLoading={isPending}
          isError={isError}
        />
      </div>
    </section>
  );
}
