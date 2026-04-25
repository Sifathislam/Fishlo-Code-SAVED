import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/howItWorks.css";

const HowItWorksPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "How it works? | Fishlo - Fresh Fish, Delivered Without the Hassle";
  }, []);

  const steps = [
    {
      id: 1,
      title: "Order Online",
      description: "Choose your favorite fish on Fishlo.in in just a few clicks.",
      image: "/assets/hiw_cart.webp",
    },
    {
      id: 2,
      title: "Freshly Prepared",
      description: "We handpick the freshest catch, clean it thoroughly, and cut it just the way you like.",
      image: "/assets/hiw_prep.webp",
    },
    {
      id: 3,
      title: "Delivered Fresh",
      description: "Vacuum packed securely and delivered to your doorstep in our premium Fishlo box.",
      image: "/assets/hiw_truck.webp",
    }
  ];

  return (
    <div className="hiw-page-wrapper">
      {/* Top Header Section */}
      <div className="hiw-header-section">
        <h1 className="hiw-main-heading">Fresh Fish, Delivered Without the Hassle</h1>
        <p className="hiw-main-subtext">
          From sea to your kitchen — cleaned, cut, and ready to cook.
        </p>
        <button onClick={() => navigate("/")} className="hiw-primary-btn">
          Order Now
        </button>
      </div>

      {/* Cards Section */}
      <div className="hiw-cards-container">
        <div className="container-custom">
          <div className="hiw-cards-grid">
            {steps.map((step) => (
              <div key={step.id} className="hiw-card">
                <div className="hiw-card-img-wrapper">
                  <img src={step.image} alt={step.title} className="hiw-card-img" />
                </div>
                <h3 className="hiw-card-title">{step.title}</h3>
                <div className="hiw-card-divider"></div>
                <p className="hiw-card-desc">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Banner Section */}
      <div className="hiw-bottom-banner">
        <div className="container-custom">
          <div className="hiw-banner-content">
            <div className="hiw-banner-line"></div>
            <h2 className="hiw-banner-text">
              No Smell. No Mess. Just Fresh, Ready-to-Cook Fish.
            </h2>
            <div className="hiw-banner-line"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
