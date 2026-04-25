import { useLocation, useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";

export default function SubCategoryBar({ onSubcategory, categories, loading }) {
  const navigate = useNavigate();
  const { search } = useLocation();

  const activeSlug = search.replace("?", "");

  const handleClick = (slug) => {
    onSubcategory(slug);
    navigate(`?${slug}`);
  };
  const renderSkeletons = () => {
    return Array(3)
      .fill(0)
      .map((_, i) => (
        <div key={i} className="col-auto category-item">
          <div className="category-img-wrapper">
            <Skeleton circle width={80} height={80} />
          </div>
          <div className="category-title" style={{ marginTop: "10px" }}>
            <Skeleton width={60} />
          </div>
        </div>
      ));
  };

  return (
    <div className={`category-bar ${loading ? 'is-loading' : ''}`}>
      <div className="container d-flex justify-content-center">
        <div className="row sub-center justify-content-start  g-4" >
          {loading
            ? renderSkeletons()
            : categories?.subcategories?.map((cat, i) => {
                const isActive = activeSlug === cat?.slug;

                return (
                  <div
                    onClick={() => handleClick(cat?.slug)}
                    key={i}
                    className={`col-auto category-item ${isActive ? "active" : ""}`}
                  >
                    <div className="category-img-wrapper">
                      <img
                        src={cat?.image}
                        alt={cat?.name}
                        width={80}
                        height={80}
                      />
                    </div>
                    <div className="category-title">{cat?.name}</div>

                    {isActive && <div className="active-line bg-black"></div>}
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
