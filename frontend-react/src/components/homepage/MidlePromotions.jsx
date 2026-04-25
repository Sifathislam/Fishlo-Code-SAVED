import { Link, useNavigate } from "react-router-dom";
import { useGetPromotionBanners } from "../../features/useBanner";

export default function MidlePromotions() {
  const { data: midleBanner, isLoading: istopLoading } = useGetPromotionBanners(
    {
      placement: "HOME_MIDDLE_BANNER",
    }
  );

  const banner = midleBanner?.[0];

  if (!banner) {
    return null;
  }

  return (
    <section className="promo-banner-section">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <Link to={banner?.link_url} className="promo-banner-3d">
              <div className="promo-banner-wrapper d-lg-block d-none">
                <img
                  src={banner?.image_desktop}
                  alt="Special Offer"
                  className="promo-banner-img"
                />
                <div className="midle-shine"></div>
              </div>
              <div className="promo-banner-wrapper d-block d-lg-none">
                <img
                  src={banner?.image_mobile}
                  alt="Special Offer"
                  className="promo-banner-img"
                />
                <div className="midle-shine"></div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
