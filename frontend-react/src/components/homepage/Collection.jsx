import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { useMostLovedProducts } from "../../features/useProduct";
import { useLocationManager } from "../../hooks/useLocationManager";
import CollectionCard from "../CollectionCard";
import CollectionSkeletonCard from "../CollectionSkeletonCard";
import LocationModal from "../LocationModal";

export default function Collection() {
  const {
    showLocationModal,
    setShowLocationModal,
    mapCenter,
    handleLocationConfirm,
  } = useLocationManager();
  const { data, isPending, isError, error } = useMostLovedProducts();
  const products = data?.results ?? [];


  // Filter the products BEFORE the return statement
  const availableProducts = products
    .filter((product) => product.is_available)
    .sort((a, b) => Number(a.isOutOfStock) - Number(b.isOutOfStock));

  const isLoopEnabled = availableProducts.length > 5;

  return (
    <>
      {showLocationModal && (
        <LocationModal
          isOpen={showLocationModal}
          mapCenter={mapCenter}
          onClose={() => setShowLocationModal(false)}
          onConfirm={handleLocationConfirm}
        />
      )}
      <section
        className="sp-collection padding-tb-50"
        style={{ position: "relative" }}
      >
        <div className="container">
          <div className="row">
            <div className="section-detail centerd mb-2 mb-lg-5">
              <div className="sp-title">
                <h2 data-cursor="big">What’s Everyone Ordering?</h2>
                <p>Customer favorites, ordered again and again.</p>
              </div>
            </div>
          </div>

          {/* ===== Swiper Carousel ===== */}
          <Swiper
            modules={[Autoplay]}
            spaceBetween={25}
            slidesPerView={4}
            loop={isLoopEnabled}
            autoplay={{ delay: 5000 }}
            navigation={false}
            pagination={{ clickable: true }}
            breakpoints={{
              320: { slidesPerView: 2 },
              576: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              1024: { slidesPerView: 4 },
              1199: { slidesPerView: 4 },
              1200: { slidesPerView: 5 },
            }}
            className="sp-collection-slider"
          >
            {isPending || isError
              ? [...Array(6)].map((_, i) => (
                  <SwiperSlide key={i}>
                    <CollectionSkeletonCard />
                  </SwiperSlide>
                ))
              : availableProducts.map((item) => (
                  <SwiperSlide key={item?.id}>
                    <CollectionCard
                      product={item}
                      setShowLocationModal={setShowLocationModal}
                    />
                  </SwiperSlide>
                ))}
          </Swiper>
        </div>
      </section>
    </>
  );
}
