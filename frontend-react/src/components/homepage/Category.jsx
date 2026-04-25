import { useNavigate } from "react-router-dom";
import { useGetCategories } from "../../features/useGetCategory";
import CategorySkeleton from "./CategorySkeleton";

export default function Category() {
  const { data: categories, isPending, isError, error } = useGetCategories();
  const navigate = useNavigate();

  return (
    <section className="sp-category-2 p-tb-50" id="category">
      <div className="container">
        <div className="row">
          <div className="section-detail centerd mb-2 mb-lg-5">
            <div className="sp-title">
              <h2 data-cursor="big">What Are You Craving Today?</h2>
              <p className="f-300">
               Choose from fresh seafood and chicken, cleaned & ready to cook.
              </p>
            </div>
          </div>
        </div>

        {isPending ? (
          <CategorySkeleton />
        ) : (
          <div className="row g-2 g-md-3 justify-content-start">
            {categories?.map((cat) => (
              <div
                key={cat?.id}
                className="col-4 col-sm-4 col-md-3 col-lg-2"
              >
                <div
                  className="text-center"
                  onClick={() => navigate(`/categories/${cat?.slug}/`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="mx-auto" style={{ width: "70%", maxWidth: "100px" }}>
                    <img
                      src={cat?.image}
                      alt={cat?.name}
                      className="img-fluid rounded-circle"
                      style={{ aspectRatio: "1/1", objectFit: "cover", width: "100%" }}
                    />
                  </div>
                  <p className="mt-1 mb-0 small fw-medium text-truncate">{cat?.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}