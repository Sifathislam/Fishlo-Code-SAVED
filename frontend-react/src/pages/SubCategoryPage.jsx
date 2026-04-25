import { useState } from "react";
import { useParams } from "react-router-dom";
import FeaturedProductCard from "../components/FeaturedProductCard";
import SubCategoryBar from "../components/SubCategoryBar";
import { useGetCategories } from "../features/useGetCategory";
import { useProducts } from "../features/useProduct";

export default function SubCategoryPage() {
  const { slug } = useParams();
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const {
    data: categories,
    isLoading: categoriesLoading,
    isError,
    error,
  } = useGetCategories();
  const {
    data: categoryProducts,
    isLoading: categoryLoading,
    isError: categoriesIsError,
    error: categoriesError,
  } = useProducts(slug);

  // Fetch SUBCATEGORY products
  const {
    data: subcategoryProducts,
    isLoading: subcategoryLoading,
    isError: subcategoryIsError,
    error: subcategoryError,
  } = useProducts(null, selectedSubcategory, {
    enabled: selectedSubcategory !== null,
  });

  const isSubcategoryActive =
    selectedSubcategory !== null && (subcategoryLoading || subcategoryProducts);

  const products = isSubcategoryActive ? subcategoryProducts : categoryProducts;

  const loading = categoryLoading || subcategoryLoading;

  const matchedCategory = categories?.find(
    (category) => category.slug === slug,
  );

  return (
    <>
      {matchedCategory?.subcategories?.length === 0 ? (
        ""
      ) : (
        <SubCategoryBar
          onSubcategory={setSelectedSubcategory}
          categories={matchedCategory}
          loading={categoryLoading}
        />
      )}

      {products?.results?.length === 0 ? (
        <div
          className="vh-100 d-flex justify-content-center align-items-center"
          style={{ marginTop: "-100px" }}
        >
          <title>SubCategory | Fishlo</title>

          <h4>No products found.</h4>
        </div>
      ) : (
        <div className="container mt-5 " style={{ minHeight: "60vh" }}>
          <title>SubCategory | Fishlo</title>

          <FeaturedProductCard data={products} isLoading={loading} />
        </div>
      )}
    </>
  );
}
