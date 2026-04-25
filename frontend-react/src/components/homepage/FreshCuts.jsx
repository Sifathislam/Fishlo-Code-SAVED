import { useProducts } from "../../features/useProduct";
import FreshCutsCard from "./FreshCutsCard";

export default function FreshCuts() {
  const { data, isPending, isError } = useProducts('fresh-cuts');
  
  if (!isPending && data?.results?.length === 0) return null;


  return (
    <section
      className="sp-product-tab sp-products padding-tb-50 pt-0"
    >
      <div className="container">
        <div className="row mb-3">
          <div className="section-detail mb-2 mb-lg-3">
            <div className="sp-title">
              <h2 data-cursor="big">Fresh Cuts</h2>
              <p>Here's what Fishlo customers love!</p>
            </div>
          </div>
        </div>
        <FreshCutsCard
          data={data}
          isLoading={isPending}
          isError={isError}
        />
      </div>
    </section>
  );
}
