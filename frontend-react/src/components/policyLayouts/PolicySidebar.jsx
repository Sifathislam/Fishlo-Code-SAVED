import { useRef, useEffect } from "react"; // 1. Import Hooks
import { NavLink, useLocation } from "react-router-dom";

const PolicySidebar = () => {
  const navRef = useRef(null);
  const location = useLocation();

  const policyNavData = [
    {
      category: "Shopping with Fishlo",
      links: [
        // { title: "How Bargaining Works", path: "/how-bargaining-works" },
        // { title: "Meet Our AI Fisherwoman", path: "/meet-ai-fisherwoman" },
        { title: "Delivery Information", path: "/delivery-information" },
        { title: "Help / Contact Us", path: "/help" },
      ],
    },
    {
      category: "Legal Information",
      links: [
        { title: "Terms & Conditions", path: "/terms-and-conditions" },
        { title: "Privacy Policy", path: "/privacy-policy" },
        { title: "Cancellation & Refund", path: "/cancellation-refund" },
      ],
    },
    {
      category: "About Fishlo",
      links: [
        { title: "How Fishlo Works?", path: "/how-fishlo-works" },
        { title: "Quality Promise", path: "/quality-promise" },
      ],
    },
  ];

  useEffect(() => {
    if (navRef.current) {
      const activeLink = navRef.current.querySelector(".nav-link.active");

      if (activeLink) {
        activeLink.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center"
        });
      }
    }
  }, [location.pathname]);

  return (
    <aside className="policy-sidebar">
      <div className="sidebar-header desktop-only">
        <h2>Fishlo Help Center</h2>
      </div>

      {/* 5. Attach the ref to the scrollable nav container */}
      <nav className="sidebar-nav" ref={navRef}>
        {policyNavData.map((group, idx) => (
          <div key={idx} className="nav-group">
            <h3 className="group-title desktop-only">{group.category}</h3>

            <div className="group-links">
              {group.links.map((link) => {
                return (
                  <div key={link.path} className="nav-item-wrapper">
                    <NavLink
                      to={link.path}
                      className={({ isActive }) =>
                        `nav-link ${isActive ? "active" : ""}`
                      }
                    >
                      {link.title}
                    </NavLink>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default PolicySidebar;
