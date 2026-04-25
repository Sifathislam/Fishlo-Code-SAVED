import { useLocation, useNavigate } from "react-router-dom";
import Loader from "../shared/components/Loader";
import { useGetCategories } from "../features/useGetCategory";

export default function CategoryPage() {
  const { data: categories, isLoading, isError, error } = useGetCategories();

  const navigate = useNavigate();
  const location = useLocation();

  const isCategoryPage = location.pathname.includes("categories");

  if (isLoading) {
    return (
      <div
        className="vh-100 d-flex align-items-center justify-content-center"
        style={{ marginTop: "-120px" }}
      >
        <Loader />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="vh-100 d-flex align-items-center justify-content-center">
        <h5>{error?.message || "Something went wrong"}</h5>
      </div>
    );
  }

  return (
    <>
      <title>Search | Fishlo</title>

      <div className="fishlo-container mb-5 mt-3" style={{ minHeight: "50vh" }}>
        <h4 className="fw-medium mb-4">Shop by Categories</h4>
        <div className="container-fluid mb-5 mt-3 px-0">
          <div className="row row-cols-3 row-cols-md-4 row-cols-lg-6 g-3 g-md-4">
            {categories?.map((cat) => (
              <div key={cat?.id} className="col">
                <div
                  onClick={() => navigate(`/categories/${cat?.slug}/`)}
                  className="text-center mx-auto"
                  style={{ cursor: "pointer", maxWidth: "120px" }}
                >
                  {/* Circular Image Container */}
                  <div
                    className="shadow-sm bg-white mx-auto rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      aspectRatio: "1 / 1",
                      width: "100%",
                      overflow: "hidden",
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    <img
                      src={cat?.image}
                      alt={cat?.name}
                      className="img-fluid"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover", // 'cover' fills the circle better for fish images
                      }}
                    />
                  </div>

                  {/* Category Name - Allows wrapping to second line */}
                  <p
                    className="mt-2 text-dark"
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      lineHeight: "1.2",
                      wordBreak: "break-word", // Ensures long words don't break the layout
                    }}
                  >
                    {cat?.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
