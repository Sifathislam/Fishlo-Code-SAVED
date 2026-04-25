import Skeleton from "react-loading-skeleton";
import { Link } from "react-router-dom";
import { useGetPromotionBanners } from "../../features/useBanner";
export default function Banner() {
  const { data: topBanner, isLoading: istopLoading } = useGetPromotionBanners({
    placement: "HOME_TOP_BANNER",
  });


  if (istopLoading) {
    return (
      <div className="container my-3">
        <div className="d-none d-md-block">
          <Skeleton
            height={300}
            width="100%"
            style={{ borderRadius: "0.5rem" }}
          />
        </div>

        <div className="d-block d-md-none">
          <Skeleton
            height={200}
            width="100%"
            style={{ borderRadius: "0.5rem" }}
          />
        </div>
      </div>
    );
  }

  if (!topBanner || topBanner.length === 0) {
    return null;
  }

  return (
    <>
      <div className="container my-3">
        <div
          id="foodCarousel"
          className="carousel slide"
          data-bs-ride="carousel"
        >
          <div className="carousel-indicators mb-3">
            {topBanner?.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                data-bs-target="#foodCarousel"
                data-bs-slide-to={index}
                className={index === 0 ? "active" : ""}
                aria-current={index === 0 ? "true" : "false"}
                aria-label={`Slide ${index + 1}`}
              ></button>
            ))}
          </div>

          <div className="carousel-inner">
            {topBanner?.map((banner, index) => (
              <div
                key={banner?.id}
                className={`carousel-item ${index === 0 ? "active" : ""}`}
              >
                <div className="banner-container d-lg-block d-none position-relative">
                  <Link to={banner?.link_url}>
                    <img
                      src={banner?.image_desktop}
                      alt={banner?.title || "Banner"}
                      className="d-block w-100 h-100"
                      style={{
                        objectFit: "fill",
                        maxHeight: "300px",
                      }}
                    />
                  </Link>
                </div>
                 <div className="banner-container d-block d-lg-none position-relative">
                  <Link to={banner?.link_url}>
                    <img
                      src={banner?.image_mobile}
                      alt={banner?.title || "Banner"}
                      className="d-block w-100 h-100"
                      style={{
                        objectFit: "fill",
                        maxHeight: "400px",
                      }}
                    />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <button
            className="carousel-control-prev"
            type="button"
            data-bs-target="#foodCarousel"
            data-bs-slide="prev"
          >
            <span
              className="carousel-control-prev-icon bg-dark rounded-circle p-3"
              style={{ backgroundSize: "50%" }}
              aria-hidden="true"
            ></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button
            className="carousel-control-next"
            type="button"
            data-bs-target="#foodCarousel"
            data-bs-slide="next"
          >
            <span
              className="carousel-control-next-icon bg-dark rounded-circle p-3"
              style={{ backgroundSize: "50%" }}
              aria-hidden="true"
            ></span>
            <span className="visually-hidden">Next</span>
          </button>
        </div>
      </div>
    </>
  );
}
