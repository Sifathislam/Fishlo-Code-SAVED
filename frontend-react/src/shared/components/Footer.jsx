import { ChevronDown, Instagram, Mail, Phone, Youtube } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useStateHooks from "../hooks/useStateHooks";
import AppPromoModal from "../../components/AppPromoModal";

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation(); // 2. Get the location object
  const { pathname } = location;
  const { setOpenLogin } = useStateHooks();
  const { auth } = useAuth();

  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menuName) => {
    if (window.innerWidth <= 991) {
      // Only toggle on mobile screens
      setOpenMenu(openMenu === menuName ? null : menuName);
    }
  };

  const handleNavigate = () => {
    if (!(auth?.authToken || auth?.refreshToken)) {
      setOpenLogin(true);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <>
      <div>
        {/* Footer */}
        <footer className="sp-footer margin-t-50">
          <div className="footer-container">
            <div className="footer-top padding-t-100 padding-b-50">
              <div className="container">
                <div className="row m-minus-991">
                  <div className="col-sm-12 col-lg-4 sp-footer-cat">
                    <div className="sp-footer-widget sp-footer-company">
                      <img
                        src="/fishlo-logo.svg"
                        className="sp-footer-logo"
                        alt="footer logo"
                      />
                      <img
                        src="/template_styles/img/logo/logo-dark.png"
                        className="sp-footer-dark-logo"
                        alt="footer logo"
                      />
                      <p className="sp-footer-detail">
                        Fishlo is not just an online seafood store. It’s a
                        modern, hygienic seafood platform designed to bring
                        clean, carefully handled fish straight to your doorstep.
                        We source fresh seafood, clean it in controlled
                        environments, and pack it with precision — without
                        chemicals or preservatives. Our promise is simple:
                        premium freshness, transparent pricing, and reliable
                        delivery.
                      </p>
                    </div>
                  </div>

                  {/* The Fishlo Experience */}
                  <div className="col-sm-12 col-lg-3 sp-footer-account pt-3">
                    <div className="sp-footer-widget">
                      <h4
                        className="sp-footer-heading d-flex justify-content-between"
                        onClick={() => toggleMenu("experience")}
                      >
                        The Fishlo Experience
                        <span className="d-lg-none">
                          <ChevronDown size={18} />
                        </span>
                      </h4>
                      <div
                        className={`sp-footer-links sp-footer-dropdown ${openMenu === "experience" ? "d-block" : ""}`}
                      >
                        <ul className="align-items-center">
                          {/* <li className="sp-footer-link">
                            <a
                              onClick={(e) => {
                                e.preventDefault();
                                navigate("/how-bargaining-works");
                              }}
                              href=""
                            >
                              How Bargaining Works
                            </a>
                          </li> */}
                          {/* <li className="sp-footer-link">
                            <a
                              onClick={(e) => {
                                e.preventDefault();
                                navigate("/meet-ai-fisherwoman");
                              }}
                              href=""
                            >
                              Meet Our AI Fisherwoman
                            </a>
                          </li> */}
                          <li className="sp-footer-link">
                            <a
                              onClick={(e) => {
                                e.preventDefault();
                                navigate("/how-it-works");
                              }}
                              href=""
                            >
                              How Fishlo Works
                            </a>
                          </li>
                          <li className="sp-footer-link">
                            <a
                              onClick={(e) => {
                                e.preventDefault();
                                navigate("/quality-promise");
                              }}
                              href=""
                            >
                              Quality Promise
                            </a>
                          </li>
                          <li className="sp-footer-link">
                            <a
                              onClick={(e) => {
                                e.preventDefault();
                                navigate("/#faq");
                              }}
                              href=""
                            >
                              FAQs
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Trust & Support */}
                  <div className="col-sm-12 col-lg-2 sp-footer-service pt-3">
                    <div className="sp-footer-widget">
                      <h4
                        className="sp-footer-heading d-flex justify-content-between"
                        onClick={() => toggleMenu("trust")}
                      >
                        Trust & Support
                        <span className="d-lg-none">
                          <ChevronDown size={18} />
                        </span>
                      </h4>
                      <div
                        className={`sp-footer-links sp-footer-dropdown ${openMenu === "trust" ? "d-block" : ""}`}
                      >
                        <ul className="align-items-center">
                          <li className="sp-footer-link">
                            <a
                              onClick={(e) => {
                                e.preventDefault();
                                navigate("/delivery-information");
                              }}
                              href=""
                            >
                              Delivery Information
                            </a>
                          </li>
                          <li className="sp-footer-link">
                            <a
                              onClick={(e) => {
                                e.preventDefault();
                                navigate("/cancellation-refund");
                              }}
                              href=""
                            >
                              Cancellation & Refund Policy
                            </a>
                          </li>
                          <li className="sp-footer-link">
                            <a
                              onClick={(e) => {
                                e.preventDefault();
                                navigate("/terms-and-conditions");
                              }}
                              href=""
                            >
                              Terms & Conditions
                            </a>
                          </li>
                          <li className="sp-footer-link">
                            <a
                              onClick={(e) => {
                                e.preventDefault();
                                navigate("/privacy-policy");
                              }}
                              href=""
                            >
                              Privacy Policy
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Contact & Availability */}
                  <div className="col-sm-12 col-lg-3 sp-footer-cont-social pt-3">
                    <div className="sp-footer-contact">
                      <div className="sp-footer-widget">
                        <h4
                          className="sp-footer-heading d-flex justify-content-between"
                          onClick={() => toggleMenu("contact")}
                        >
                          Contact & Availability
                          <span className="d-lg-none">
                            <ChevronDown size={18} />
                          </span>
                        </h4>
                        <div
                          className={`sp-footer-links sp-footer-dropdown ${openMenu === "contact" ? "d-block" : ""}`}
                        >
                          <ul className="align-items-center">
                            <li className="sp-footer-link sp-foo-call">
                              <a href="tel:+919619600000">
                                <Phone size={18} strokeWidth={1} />{" "}
                                +919619600049
                              </a>
                            </li>
                            <li className="sp-footer-link sp-foo-mail">
                              <a href="mailto:support@fishlo.in">
                                <Mail size={18} strokeWidth={1} />{" "}
                                support@fishlo.in
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="footer-bottom">
              <div className="container">
                <div className="row">
                  <div className="sp-bottom-info">
                    <div className="footer-copy">
                      <div className="footer-bottom-copy ">
                        <div className="sp-copy">
                          Copyright © <span id="copyright_year" />
                          Fishlo Technologies. All rights reserved.
                        </div>
                      </div>
                    </div>
                    <div className="footer-bottom-right">
                      <div className="footer-social d-flex gap-3 justify-content-center align-items-center">
                        <a
                          href="https://instagram.com"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Instagram size={20} strokeWidth={1.5} />
                        </a>

                        <a
                          href="https://youtube.com"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Youtube size={20} strokeWidth={1.5} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
        {/* Footer Nav For Mobile*/}
        <div className="sp-footer-mobile d-lg-none d-block">
          <ul>
            <li>
              <div
                onClick={() => navigate("/")}
                className={`nav-item ${pathname === "/" ? "active" : ""}`}
              >
                <svg
                  className="svg-icon"
                  // viewBox="0 0 24 24"
                  viewBox="0 0 128 128"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Rounded, organic pentagon shape */}
                  <path
                    d="M64 12 
                      C75 12 110 35 115 45 
                      C122 60 115 105 110 112 
                      C105 118 23 118 18 112 
                      C13 105 6 60 13 45 
                      C18 35 53 12 64 12Z"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {/* The Inner Vertical Marker */}
                  <path
                    d="M64 78V98"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="nav-text ">Fishlo</span>
              </div>
            </li>

            {/* Categories */}
            <li>
              <div
                onClick={() => navigate("/categories")}
                className={`nav-item ${
                  pathname === "/categories" ? "active" : ""
                }`}
              >
                <svg
                  className="svg-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Layers Icon */}
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
                <span className="nav-text">Categories</span>
              </div>
            </li>

            {/*  Search */}
            <li>
              <div
                onClick={() => navigate("/search")}
                className={`nav-item ${pathname === "/search" ? "active" : ""}`}
              >
                <svg
                  className="svg-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Magnifying Glass Icon */}
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span className="nav-text">Search</span>
              </div>
            </li>

            {/* Account */}
            <li>
              <div
                onClick={handleNavigate}
                className={`nav-item ${
                  pathname.startsWith("/dashboard") ? "active" : ""
                }`}
              >
                <svg
                  className="svg-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* User Icon */}
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span className="nav-text">Account</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <AppPromoModal />
    </>
  );
}
