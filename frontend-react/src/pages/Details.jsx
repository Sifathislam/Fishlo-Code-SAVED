import { useParams } from "react-router-dom";
import FishloProductTabs from "../components/details/FishloProductTabs";
import Masala from "../components/details/Masala";
import NonBargain from "../components/details/NonBargain";
import ProductContent from "../components/details/ProductContent";
import RelatedProduct from "../components/details/RelatedProduct";
import SingleProductRightSide from "../components/details/SingleProductRightSide";
import SingleProdcutTab from "../components/details/SingleProductTab";
import WholesaleBanner from "../components/details/WholesaleBanner";
import ProductContentSkeleton from "../components/detailsSkeleton/ProductContentSkeleton";
import RelatedProductsSkeleton from "../components/detailsSkeleton/RelatedProductsSkeleton";
import { useGetCart } from "../features/useCart";
import { useFishloMasalaProducts } from "../features/useGetMasala";
import { useSingleProduct } from "../features/useSingleProduct";
import useAuth from "../hooks/useAuth";
import useStateHooks from "../shared/hooks/useStateHooks";
import RightSideSkeleton from "../components/detailsSkeleton/RightSideSkeleton";
import { useMostLovedProducts } from "../features/useProduct";

export default function DetailsPage() {
  const { slug } = useParams();
  const {
    product,
    relatedProducts,
    isLoading: isDetailsLoading,
    isError,
    error,
  } = useSingleProduct(slug);
  const { data, isLoading: mosalaIsLoading } = useFishloMasalaProducts();
  const { data: productData, isLoading: productLoading } = useMostLovedProducts();
  const { data: cart } = useGetCart();
  const { setCartOpen } = useStateHooks();
  const { auth } = useAuth();


  const isLoading = isDetailsLoading || mosalaIsLoading;



  //  Description: Clean up HTML if present, limit length for SEO
  const metaDescription = product?.short_description
    ? product.short_description.replace(/<[^>]+>/g, "").substring(0, 160)
    : "Buy fresh fish and seafood online.";

  //  Image: Use first gallery image
  const metaImage =
    product?.gallery?.length > 0 ? product.gallery[0].image : "";

  //  Keywords
  const keywords = [
    //  Brand
    "Fishlo",
    "Fishlo online",

    //  High Intent (Buying & Delivery)
    "online fish delivery",
    "fresh fish home delivery",
    "buy fish online",
    "order fresh seafood",
    "seafood delivery app",
    "cash on delivery fish", // Strong keyword for trust
    "fastest fish delivery",

    //  Quality & Trust (Crucial for conversions)
    "chemical free fish",
    "formalin free fish",
    "preservative free seafood",
    "100% fresh fish",

    "buy premium sea fish",

    //  Convenience & Added Products
    "ready to cook fish",
    "cleaned and cut fish",
    "whole fish cleaned",
    "fish curry cut",
    "fish masala powder",
    "fish fry masala",

    //  Dynamic Product Keywords
    product?.name,
    `Buy ${product?.name}`,
    `Fresh ${product?.name} online`,
    product?.category?.name,
    product?.subcategory?.name,
  ]
    .filter(Boolean)
    .join(", ");
  
  return (
    <>
      {!isLoading && product && (
        <>
          <title>{`${product.name} - Buy Online Fish | Fishlo`}</title>
          <meta name="description" content={metaDescription} />
          <meta name="keywords" content={keywords} />

          {/* Open Graph (WhatsApp / Facebook) */}
          <meta property="og:type" content="product" />
          <meta property="og:title" content={product?.name} />
          <meta property="og:description" content={metaDescription} />
          <meta property="og:image" content={metaImage} />
          <meta property="og:site_name" content="Fishlo" />
          <meta property="og:url" content={window.location.href} />
          <meta property="og:locale" content="en_IN" />

          {/* Product Schema for India */}
          <meta
            property="product:price:amount"
            content={product.display_price}
          />
          <meta property="product:price:currency" content="INR" />
          <meta
            property="product:availability"
            content={product.is_available ? "in stock" : "pre-order"}
          />

          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={product.name} />
          <meta name="twitter:description" content={metaDescription} />
          <meta name="twitter:image" content={metaImage} />

          {/* Canonical Link & Robots */}
          <link rel="canonical" href={window.location.href} />
          <meta name="robots" content="index, follow" />
        </>
      )}
      {isLoading || productLoading ? (
        <section className="sp-single-product padding-tb-50">
          <div className="container">
            <div className="row">
              <div className="col-xl-8 col-lg-8 col-md-12">
                <ProductContentSkeleton />
                <RelatedProductsSkeleton />
              </div>
              <div className="col-xl-4 col-lg-4 col-md-12">
                <RightSideSkeleton />

              </div>
            </div>
          </div>
        </section>
      ) : isError || !product ? (
        <div
          className="vh-100 d-flex align-items-center justify-content-center"
          style={{ marginTop: "-100px" }}
        >
          <h5>{error?.message || "Something went wrong"}</h5>
        </div>
      ) : (
        <section className="sp-single-product padding-tb-50">
          <div className="container">
            <div className="row ">
              <div className="col-xl-8 col-lg-8 col-md-12 margin-b-30">
                <ProductContent product={product} />
                <Masala data={data} />

                <FishloProductTabs product={product} />

                <SingleProdcutTab product={product} />
                {relatedProducts?.results?.length === 0 ? null : (
                  <RelatedProduct relatedProducts={relatedProducts} />
                )}
                {cart?.items_count > 0 && (
                  <div
                    className="cart-summary accent-gradient"
                    onClick={() => setCartOpen(true)}
                    style={{ display: "flex" }}
                  >
                    <div>
                      <span>{cart?.items_count}</span> Items &nbsp;
                      <span style={{ opacity: 0.5 }}>|</span>&nbsp;{" "}
                      <span style={{ fontWeight: "400" }}>₹{cart?.subtotal}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      View Cart
                      <i
                        className="fas fa-chevron-right ms-2"
                        style={{ fontSize: "0.8rem" }}
                      ></i>
                    </div>
                  </div>
                )}
              </div>

              <div className="col-xl-4 col-lg-4 col-md-12">
                {product?.isMasalaProduct ? (
                  <SingleProductRightSide data={productData} />
                ) : (
                  <div className="d-none d-lg-block">
                    {(
                      product?.category?.slug?.toLowerCase().includes("frozen") || 
                      product?.category?.name?.toLowerCase().includes("frozen") ||
                      product?.subcategory?.slug?.toLowerCase().includes("frozen") ||
                      product?.subcategory?.name?.toLowerCase().includes("frozen")
                    ) ? (
                      <WholesaleBanner />
                    ) : (
                      <NonBargain />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
