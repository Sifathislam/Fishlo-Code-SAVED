import { Link } from "react-router-dom";

export default function About() {
  return (
    <section className="sp-about padding-tb-50">
      <div className="container">
        <div className="row">
          <div className="col-lg-7">
            <div className="sp-img-set">
              <div className="sp-img-box">
                <img
                  className="main-img" src="/masala_image/Fishlo_Premium_Fish_Curr_ Masala _Medium_Spicy.png"alt="about"/>
                <div className="sp-detail">
                  <div
                    className="info"
                    style={{ background: "transparent", padding: 0 }}
                  >
                    <img
                      className="rounded-4"
                      src="/masala_image/fish-fry.webp"
                      alt="15 Years of Excellence"
                      style={{ width: "100%", height: "auto" }}
                    />
                  </div>
                  <div
                    className="sp-shap"
                  >
                    <img src="/masala_image/masala_one_bg.png" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-5">
            <div
              className="section-detail mb-0"
            >
              <div className="sp-title">
                <p>Crafted in our kitchens, inspired by coastal homes.</p>
                <h2 data-cursor="big">Fishlo Signature Homemade Masalas</h2>
              </div>
            </div>
            <p>
              Rooted in the coastal kitchens of Mangalore, Fishlo Signature
              Masalas bring the bold, aromatic flavours of Kudla straight to
              your home. Carefully crafted in small batches, our blends capture
              the soul of traditional Mangalorean seafood—fresh, fiery, and full
              of character.
            </p>
            <div className="sp-details">
              <div className="list">
                <div className="icon">
                  <img
                    src="/masala_image/homemade.svg"
                    alt="Homemade & Small Batch"
                    className="feature-icon"
                  />
                </div>
                <div className="info">
                  <h5>Homemade & Small-Batch Prepared</h5>
                  <p>
                    Carefully prepared in small batches using traditional
                    methods, allowing us to maintain freshness, consistency, and
                    the authentic taste that homemade masalas are known for.
                  </p>
                </div>
              </div>

              <div className="list">
                <div className="icon">
                  <img
                    src="/masala_image/chemical-free.svg"
                    alt="Chemical Free"
                    className="feature-icon"
                  />
                </div>
                <div className="info">
                  <h5>No Preservatives or Artificial Colours</h5>
                  <p>
                    Crafted using high-quality natural spices, without adding
                    preservatives, artificial colours, or chemicals—just pure
                    ingredients and honest flavour.
                  </p>
                </div>
              </div>
            </div>
            <div
              className="sp-read">
              <Link
                to="/fishlo-signature-fish-fry-masala-spicy-200g"
                className="sp-btn-4"
              >
                Order Now <i className="ri-arrow-right-long-line" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
