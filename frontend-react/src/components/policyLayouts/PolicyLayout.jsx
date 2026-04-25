import { Outlet, useLocation } from "react-router-dom";
import "../../styles/termsPrivacy.css";
import PolicySidebar from "./PolicySidebar";

const PolicyLayout = () => {
  const location = useLocation();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case "/terms-and-conditions":
        return "Terms & Conditions";
      case "/privacy-policy":
        return "Privacy Policy";
      case "/cancellation-refund":
        return "Cancellation & Refund";
      case "/how-fishlo-works":
        return "How Fishlo Works";
      case "/quality-promise":
        return "Quality Promise";
      // case "/how-bargaining-works":
      //   return "How Bargaining Works";
      // case "/meet-ai-fisherwoman":
      //   return "Meet Our AI Fisherwoman";
      case "/delivery-information":
        return "Delivery Information";
      case "/help":
        return "Help Center";
      default:
        return "Legal Information"; // Fallback title
    }
  };

  const currentTitle = getPageTitle(location.pathname);
  return (
    <div className="policy-layout-root">
      <title>{`${currentTitle} | Fishlo Help Center`}</title>
      <meta
        name="description"
        content={`Read the ${currentTitle} for Fishlo.`}
      />
      <header className="policy-header-hero">
        <div className="policy-fishlo-wrapper">
          <h1>{currentTitle}</h1>
          <p className="meta">Last Updated: January 6, 2026</p>
        </div>
      </header>

      {/* 2. Main Content Grid */}
      <div className="policy-fishlo-wrapper policy-grid-area">
        {/* Navigation (Sidebar on Desktop / Tabs on Mobile) */}
        <PolicySidebar />

        {/* Page Content */}
        <main className="policy-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PolicyLayout;
