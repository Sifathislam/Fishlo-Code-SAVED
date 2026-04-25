import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const location = useLocation();
  const isDelivery = location.pathname.startsWith("/delivery");

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const storageKey = isDelivery ? "splashShown_delivery" : "splashShown";
    const hasSeenSplash = sessionStorage.getItem(storageKey);

    if (isMobile && !hasSeenSplash) {
      setIsVisible(true);
      setTimeout(() => setIsFadingOut(true), 2800);
      setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem(storageKey, "true");
      }, 3500);
    }
  }, [isDelivery]);

  if (!isVisible) return null;

  return (
    <div className={`fishlo-white-splash ${isFadingOut ? "splash-exit" : ""}`}>
      <div className="splash-center-stack">
        {/* Logo with a soft floating entrance */}
        <div className="logo-wrapper">
          <img src="/fishlo-logo.svg" alt="Fishlo" className="prime-logo" />
        </div>

        {/* The elegant split-reveal tagline */}
        <div className="tagline-reveal-box">
          <p className="clean-tagline">
            {isDelivery ? "FISHLO." : "FRESH."}
            <span style={{ color: "#d7574c" }} className="red-accent">
              {isDelivery ? " DELIVERY." : " PREMIUM."}
            </span>
            {isDelivery ? " PARTNER" : " SEAFOOD"}
          </p>
        </div>

        {/* Ultra-minimalist thin line loader */}
        <div className="minimal-line-container">
          <div className="line-fill"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
