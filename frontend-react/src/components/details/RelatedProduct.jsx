import SingleProductCard from "./SingleProductCard";

export default function RelatedProduct({ relatedProducts }) {
  return (
    <div className="m-t-30">
      <SingleProductCard data={relatedProducts} />
    </div>
  );
}
