import { useState } from "react";
import { useProductCombinedInfo } from "../../features/useProductMetaInfo";

const FishloProductTabs = ({ product }) => {
  const { source, whatYouGet, isLoading } = useProductCombinedInfo(product?.id);
  const [activeTab, setActiveTab] = useState("tab-specs"); 


  const sourceData =
    Array.isArray(source) && source.length > 0 ? source[0] : null;
  const whatGetData =
    Array.isArray(whatYouGet) && whatYouGet.length > 0 ? whatYouGet[0] : null;

  if (!product || !source || !whatYouGet) return null;
  if (isLoading) return <div className="p-4 text-center">Loading info...</div>;


  return (
    <div className="py-4">
      <div className="fishlo-product-wrapper">
        <div className="fishlo-nav-area">
          <div className="fishlo-tab-list">
            <button
              className={`fishlo-tab-btn ${
                activeTab === "tab-specs" ? "is-active" : ""
              }`}
              onClick={() => setActiveTab("tab-specs")}
            >
              What you get
            </button>
            <button
              className={`fishlo-tab-btn ${
                activeTab === "tab-sourcing" ? "is-active" : ""
              }`}
              onClick={() => setActiveTab("tab-sourcing")}
            >
              Sourcing
            </button>
          </div>
        </div>

        <div className="fishlo-media-area">
          {activeTab === "tab-specs" && whatGetData?.image_url && (
            <img
              src={whatGetData.image_url}
              className="fishlo-img-display"
              alt={whatGetData.name || "Product Spec"}
            />
          )}

          {activeTab === "tab-sourcing" && sourceData?.image_url && (
            <img
              src={sourceData.image_url}
              className="fishlo-img-display"
              alt={sourceData.name || "Sourcing Origin"}
            />
          )}
        </div>


        <div className="fishlo-details-area">

          {activeTab === "tab-specs" && whatGetData && (
            <div className="fishlo-fade-in fishlo-desc-text">
              <div dangerouslySetInnerHTML={{ __html: whatGetData.content }} />
            </div>
          )}


          {activeTab === "tab-sourcing" && sourceData && (
            <div className="fishlo-fade-in fishlo-desc-text">
              <div dangerouslySetInnerHTML={{ __html: sourceData.content }} />
            </div>
          )}


          {activeTab === "tab-specs" && !whatGetData && (
            <p className="text-muted">Information not available.</p>
          )}
          {activeTab === "tab-sourcing" && !sourceData && (
            <p className="text-muted">Sourcing information not available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FishloProductTabs;
