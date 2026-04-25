export default function MasalaHome() {
  return (
    <section className="white-3d-section">
      <div className="ambient-blob blob-red" />
      <div className="ambient-blob blob-gold" />
      <div className="ambient-blob blob-green" />

      <div
        className="container position-relative d-flex flex-column align-items-center"
        style={{ zIndex: 2 }}
      >
        <div className="text-center mb-4 header-content">
          <h2 className="masala-title">Authentic Taste</h2>
          <p className="masala-subtitle">
            Premium spice blends crafted for the perfect catch.
          </p>
        </div>

        <div className="stage-container">
          <div className="card-3d pos-left">
            <img
              src="/masala_image/Signature_Fish_Fr_Masala.png"
              alt="Red Masala"
              className="masala-img"
            />
          </div>

          <div className="card-3d pos-center">
            <img
              src="/masala_image/masala_one.png"
              alt="Medium Masala"
              className="masala-img"
            />
          </div>

          <div className="card-3d pos-right">
            <img
              src="/masala_image/Green_Chill_Fish_Fry_Masala_Extra_Spicy.png"
              alt="Green Masala"
              className="masala-img"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
