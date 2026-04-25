import { useNavigate } from "react-router-dom";

const TopAppBanner = () => {
  const navigate = useNavigate();

  return (
    <div
      className="d-lg-none d-block  app-download-banner"
      style={{
        backgroundColor: "#fff",
        padding: "10px 16px",
        borderBottom: "1px solid #eee",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      {/* Minimal hover style */}
      <style>{`
        .fishlo-btn {
          background-color: #E4645A;
          color: white;
          font-weight: 700;
          font-size: 12px;
          padding: 6px 14px;
          border-radius: 5px;
          border: none;
          white-space: nowrap;
          min-width: 80px;
          text-decoration: none;
          display: inline-block;
        }
        .fishlo-btn:hover {
          background-color: #b9463c;
          color: white;
        }
      `}</style>

      <div className="d-flex align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-2 overflow-hidden">
          <div
            className="brand-logo d-flex align-items-center"
            onClick={() => navigate("/")}
            style={{
              fontWeight: 800,
              color: "#E4645A",
              fontSize: "1.1rem",
              cursor: "pointer",
            }}
          >
            <img
              className=""
              src="/fishlo-logo.svg"
              alt="Fishlo logo"
              style={{
                width: "80px",
                height: "38px",
                borderRadius: "8px",
                objectFit: "contain",
                flex: "0 0 38px",
              }}
            />
          </div>

          <div className="banner-text-group" style={{ lineHeight: 1.2 }}>
            <span
              className="banner-title"
              style={{
                color: "#393f4a",
                fontWeight: 700,
                fontSize: "14px",
                display: "block",
              }}
            >
              Don't miss out!
            </span>

            <span
              className="banner-subtitle"
              style={{
                color: "#888",
                fontSize: "11px",
                display: "block",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Get the app for exclusive benefits
            </span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <button className="fishlo-btn" onClick={() => navigate("/app")}>
            GET APP
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopAppBanner;
