import React, { useState,useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useProducts } from "../features/useProduct";
import { useGetCategories } from "../features/useGetCategory";
import FeaturedItem from "../components/FeaturedCard";
import Loader from "../shared/components/Loader";

export default function AllProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromParams = searchParams.get("category") || "";
  const productType = searchParams.get("type") || "all";
  
  const [selectedCategory, setSelectedCategory] = useState(categoryFromParams);
  const [sortOption, setSortOption] = useState("default");
  const [filterInStock, setFilterInStock] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useGetCategories();
  // Pass the sorting and filtering states to our custom hook to trigger API refetch
  const { data, isLoading, isError, error, isFetching } = useProducts(selectedCategory, "", filterInStock, sortOption);

  const handleTypeChange = (type) => {
    setSearchParams((prev) => {
      if (type === "all") {
        prev.delete("type");
      } else {
        prev.set("type", type);
      }
      return prev;
    });
  };

  const rawProducts = data?.results ?? [];
  const products = rawProducts.filter((p) => {
    const isMasalaCat =
      p.category === "masala" ||
      p.category?.slug?.toLowerCase() === "masala" ||
      p.category?.name?.toLowerCase() === "masala";

    if (productType === "packed") {
      return p.isPackedProduct && !isMasalaCat;
    }
    if (productType === "weighted") {
      return !p.isPackedProduct && !isMasalaCat;
    }
    if (productType === "masala") {
      return isMasalaCat;
    }
    return true;
  });

  useEffect(() => {
    setSelectedCategory(categoryFromParams);
  }, [categoryFromParams]);

  return (
    <>
      <title>All Products | Fishlo</title>
      <div className="fishlo-container mb-5 mt-3" style={{ minHeight: "70vh" }}>
        
        {/* Header */}
        <div className="d-flex align-items-center mb-3 mb-md-4">
          <Link to="/" className="text-dark me-2 me-md-3" style={{ textDecoration: "none" }}>
            <i className="ri-arrow-left-line fs-5 fs-md-4"></i>
          </Link>
          <h5 className="fw-medium m-0 fs-5">All Products</h5>
        </div>

        {/* Category Filter Pills (Mobile Friendly Horizontal Scroll) */}
        {!categoriesLoading && categories?.length > 0 && (
          <div className="d-flex overflow-auto mb-3 pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none", gap: "10px" }}>
             <button 
                onClick={() => {
                  setSelectedCategory("");
                  searchParams.delete("category");
                  setSearchParams(searchParams);
                }}
                className="btn btn-sm rounded-pill px-3 shadow-none"
                style={{ 
                   whiteSpace: "nowrap", 
                   backgroundColor: selectedCategory === "" ? "var(--fishlo-red, #e4645a)" : "#f8f9fa",
                   color: selectedCategory === "" ? "#fff" : "#495057",
                   border: selectedCategory === "" ? "none" : "1px solid #dee2e6",
                   fontWeight: selectedCategory === "" ? "500" : "400",
                   fontSize: "0.85rem"
                }}
             >
                All Items
             </button>
             {categories.map(cat => (
                <button 
                  key={cat.slug}
                  onClick={() => {
                  setSelectedCategory(cat.slug);
                  searchParams.set("category", cat.slug);
                  setSearchParams(searchParams);}}
                  className="btn btn-sm rounded-pill px-3 shadow-none"
                  style={{ 
                     whiteSpace: "nowrap", 
                     backgroundColor: selectedCategory === cat.slug ? "var(--fishlo-red, #e4645a)" : "#f8f9fa",
                     color: selectedCategory === cat.slug ? "#fff" : "#495057",
                     border: selectedCategory === cat.slug ? "none" : "1px solid #dee2e6",
                     fontWeight: selectedCategory === cat.slug ? "500" : "400",
                     fontSize: "0.85rem"
                  }}
                >
                  {cat.name}
                </button>
             ))}
          </div>
        )}

        {/* Filter and Sort Bar */}
        <div className="d-flex mx-0 flex-row justify-content-between align-items-center mb-4 gap-2 bg-white p-2 p-md-3 rounded shadow-sm border" style={{ flexWrap: "wrap" }}>
          <div className="form-check form-switch m-0 d-flex align-items-center ps-5">
            <input
              className="form-check-input mt-0 me-2"
              type="checkbox"
              id="inStockOnly"
              checked={filterInStock}
              onChange={(e) => setFilterInStock(e.target.checked)}
              style={{ cursor: "pointer", marginLeft: "-2rem" }}
            />
            <label className="form-check-label" htmlFor="inStockOnly" style={{ cursor: "pointer", userSelect: "none", fontSize: "0.85rem" }}>
              In-Stock
            </label>
          </div>

          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select border-0 bg-light py-1 px-2"
              value={productType}
              onChange={(e) => handleTypeChange(e.target.value)}
              style={{ minWidth: "140px", cursor: "pointer", fontSize: "0.85rem" }}
            >
              <option value="all">All Products</option>
              <option value="weighted">Weighted</option>
              <option value="packed">Packed</option>
              <option value="masala">Masala</option>
            </select>

            <select
              className="form-select border-0 bg-light py-1 px-2"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              style={{ minWidth: "140px", cursor: "pointer", fontSize: "0.85rem" }}
            >
              <option value="default">Sort by: Relevance</option>
              <option value="price_low_high">Price: Low to High</option>
              <option value="price_high_low">Price: High to Low</option>
              <option value="name_a_z">Name: A to Z</option>
              <option value="name_z_a">Name: Z to A</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {isLoading || isFetching ? (
          <div className="d-flex align-items-center justify-content-center py-5">
            <Loader />
          </div>
        ) : isError ? (
          <div className="text-center text-danger py-5">
            <h5 className="fs-6 fs-md-5">{error?.message || "Failed to load products"}</h5>
          </div>
        ) : (
          <div className="container-fluid px-0">
            <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-2 g-md-3 g-lg-4">
              {products.map((item) => (
                <div key={item.id} className="col">
                  {/* Reuse Existing Item styling structure */}
                  <FeaturedItem item={item} />
                </div>
              ))}
            </div>
            {products.length === 0 && (
              <div className="text-center py-5 text-muted">
                  <i className="ri-shopping-bag-3-line fa-3x mb-3 text-secondary opacity-25"></i>
                  <h5 className="fs-6 fs-md-5 mt-2">No products match your criteria.</h5>
              </div>
            )}
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .overflow-auto::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </>
  );
}
