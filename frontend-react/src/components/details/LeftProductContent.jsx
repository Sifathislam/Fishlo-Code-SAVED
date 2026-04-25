import { useState } from "react";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// --- HELPER COMPONENT FOR ZOOM (Unchanged) ---
const ZoomImage = ({ src }) => {
  const [transformStyle, setTransformStyle] = useState({
    transformOrigin: "center center",
    transform: "scale(1)",
  });

  const handleMouseMove = (e) => {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setTransformStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: "scale(2)",
    });
  };

  const handleMouseLeave = () => {
    setTransformStyle({
      transformOrigin: "center center",
      transform: "scale(1)",
    });
  };

  return (
    <div>
      <img
        className="img-responsive"
        src={src}
        alt="Product"
        style={{
          width: "100%",
          display: "block",
          transition: "transform 0.1s ease-out",
          ...transformStyle,
        }}
      />
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function LeftProductContent({ product }) {
  if (!product?.gallery) return null;

  return (
    <div className="single-pro-img">
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={10}
        slidesPerView={1}
        navigation={true}
        pagination={{ clickable: true }}
        className="single-product-cover"
        // 👇 ADD THIS STYLE PROP
        style={{
          // Make arrows smaller (Default is usually 44px)
          "--swiper-navigation-size": "20px",

          //  Make arrows white (Optional, assumes you want them to match dots)
          "--swiper-navigation-color": "#fff",

          //  Make Active Dot White
          "--swiper-pagination-color": "#fff",

          "--swiper-pagination-bullet-inactive-color": "#fff",
          "--swiper-pagination-bullet-inactive-opacity": "0.5",
          "--swiper-pagination-bullet-size": "10px",
        }}
      >
        {product.gallery.map((photo) => (
          <SwiperSlide key={photo.id}>
            <div className="sp-single-slide">
              <ZoomImage src={photo.image} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
