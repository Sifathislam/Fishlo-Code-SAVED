import { getCategory } from "@/queries/category";
import Image from "next/image";
import Link from "next/link";

export default async function CategoryGrid() {
  const categories = await getCategory();
  
  return (
    <div
      className="container mb-5 mt-3"
      style={{
        minHeight: "50vh", // ensures it fills full screen height
      }}
    >
      <h4 className="fw-medium mb-4">Shop by Categoriesss</h4>

      <div className="row g-2">
        {categories.map((cat) => (
          <Link
            href={`/shop/${cat?.slug}/`}
            key={cat?.id}
            className="col-6 col-sm-4 col-md-3 col-lg-2 text-center"
          >
            <div
              className="p-2 rounded-circle shadow-sm bg-white mx-auto"
              style={{
                width: "120px",
                height: "120px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <Image
                src={cat?.image}
                alt={cat?.name}
                fill
                className="object-cover"
              />
            </div>
            <p className="mt-2 text-dark">{cat?.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
