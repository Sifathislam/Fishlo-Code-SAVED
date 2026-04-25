import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules"; // 1. Import the Navigation module
import "swiper/css";
import "swiper/css/navigation"; // 2. Import the Navigation CSS
import Skeleton from "react-loading-skeleton";

export default function CategorySkeleton() {
  return (
    <section className="sp-category-2 p-tb-50" id="category">
      <div className="container">
        
        {/* Swiper Slider Skeleton */}
        <Swiper
          modules={[Navigation]} 
          navigation={false}     
          grabCursor={true}     
          spaceBetween={20}
          slidesPerView={5}
          breakpoints={{
            320: { slidesPerView: 2 },
            576: { slidesPerView: 3 },
            768: { slidesPerView: 4 },
            1024: { slidesPerView: 8 },
          }}
          className="sp-category-slider"
        >
          {Array(10)
            .fill(0)
            .map((_, index) => (
              <SwiperSlide key={index}>
                <div className="sp-category-block">
                  <div className="category-detail">
                    <div className="category-img">
                      <Skeleton 
                        height={85} 
                        width={85} 
                        style={{ marginBottom: "5px" }} 
                      />
                    </div>

                    <div className="category-info">
                      <h5>
                        <Skeleton width={80} height={20} />
                      </h5>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
        </Swiper>
      </div>
    </section>
  );
}
