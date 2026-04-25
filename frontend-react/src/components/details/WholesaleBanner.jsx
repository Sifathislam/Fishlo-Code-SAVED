import { Building2, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export default function WholesaleBanner() {
  return (
    <div className="nb-card">
      <div className="nb-hero">
        <div className="d-flex align-items-center mb-2">
          <Building2 size={24} className="me-2" style={{ color: "#E4645A" }} />
          <div className="fw-bold fs-5" style={{ color: "#393f4a" }}>Bulk / Restaurant Orders</div>
        </div>
        <div style={{ fontSize: "0.9rem", color: "#666" }}>
          Looking for wholesale quantities of premium frozen seafood for your
          restaurant or business?
        </div>
      </div>
      <div className="nb-body">
        <ul className="mb-3 ps-3 small text-secondary">
          <li className="mb-1">Special B2B Pricing</li>
          <li className="mb-1">Dedicated Account Manager</li>
          <li>Consistent Supply & Quality</li>
        </ul>
        <div className="d-flex flex-column gap-2">
          <Link to="/wholesale" className="btn sp-btn-1 accent-gradient w-100 fw-medium d-flex align-items-center justify-content-center m-0" style={{ border: 'none', color: '#fff', padding: '10px 0' }}>
            View Wholesale Pricing
          </Link>
          <a
            href="tel:+919619600049"
            style={{ border: "1px solid #E4645A", color: "#E4645A", padding: '10px 0' }}
            className="btn bg-white w-100 fw-medium d-flex align-items-center justify-content-center mb-1"
          >
            <Phone size={16} className="me-2" />
            +91 96196 00049
          </a>
        </div>
      </div>
    </div>
  );
}
