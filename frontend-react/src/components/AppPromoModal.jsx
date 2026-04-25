import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AppPromoModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [textIndex, setTextIndex] = useState(0);
  const navigate = useNavigate();

  const slides = [
    {
      title: "Better Shopping Experience",
      subtitle: "With live tracking & exclusive app features!",
      highlight: false,
    },
    {
      title: "20% off upto 200 + free delivery on first order",
      subtitle: "Download app and start saving big!",
      highlight: true,
    },
    {
      title: "Fast & Fresh Delivery",
      subtitle: "Get your fish delivered within 60 mins.",
      highlight: false,
    },
  ];

  const COOLDOWN_MS = 24 * 60 * 60 * 1000; // Example: 24 hours
  // const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

  useEffect(() => {
    const savedTime = sessionStorage.getItem("nextPromoTime");

    // If nothing saved → treat as first visit
    if (!savedTime) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }

    const now = Date.now();

    // If current time >= saved time → show promo again
    if (now >= Number(savedTime)) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }

    // Otherwise, do not show modal
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setTextIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    const nextTime = Date.now() + COOLDOWN_MS;
    sessionStorage.setItem("nextPromoTime", String(nextTime));
  };

  if (
    !isVisible &&
    typeof window !== "undefined" &&
    sessionStorage.getItem("hasSeenPromo")
  ) {
    return null;
  }

  return (
    <>
      <div className="d-lg-none d-block">
        <div
          className={` promo-backdrop ${isVisible ? "active" : ""}`}
          onClick={handleClose}
        ></div>

        <div className={`promo-sheet ${isVisible ? "active" : ""}`}>
          {/* CLOSE BUTTON (Moved outside image container conceptually via CSS) */}
          <button className="btn-close-x" onClick={handleClose}>
            {/* Dark Icon on White Circle */}
            <X size={24} color="#333333" strokeWidth={2.5} />
          </button>

          {/* Image Container */}
          <div className="promo-image-container">
            <img
              src="/Image/fishloapp.webp"
              alt="Fishlo App Preview"
              className="promo-main-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://via.placeholder.com/400x200/fceceb/d7574c?text=Fishlo+App";
              }}
            />
          </div>

          {/* Content */}
          <div className="container px-4 pb-3">
            <div className="text-carousel-window">
              <div
                className="text-carousel-track"
                style={{ transform: `translateY(-${textIndex * 60}px)` }}
              >
                {slides.map((slide, index) => (
                  <div key={index} className="carousel-item-text">
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        color: slide.highlight
                          ? "var(--fishlo-red)"
                          : "#393f4a",
                      }}
                    >
                      {slide.title}
                    </h4>
                    <p
                      style={{
                        margin: "5px 0 0 0",
                        fontSize: "0.9rem",
                        color: "#777",
                      }}
                    >
                      {slide.subtitle}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="btn-fishlo-primary"
              onClick={() => {
                handleClose();
                navigate("/app");
              }}
            >
              Download App Now
            </button>

            <div className="text-center">
              <button className="btn-fishlo-ghost" onClick={handleClose}>
                Continue on Web
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppPromoModal;
