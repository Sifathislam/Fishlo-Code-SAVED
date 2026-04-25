import { createPortal } from "react-dom";

const CutSelectionModal = ({ show, onClose, product, onSelectCut }) => {
  if (!show || !product) return null;

  return createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        zIndex: 10050,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="bg-white rounded-4 shadow-lg p-0 overflow-hidden animate-zoom-in"
        style={{ width: "90%", maxWidth: "400px" }}
      >
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
          <h6 className="fw-medium m-0 text-dark">Select Cut Option</h6>
          <button className="btn-close" onClick={onClose}></button>
        </div>
        <div className="p-4 text-center">
          <div className="mb-3">
            <img
              src={product.image}
              className="rounded-3 shadow-sm object-fit-cover"
              width="80"
              height="80"
              alt=""
            />
            <h6 className="fw-medium mt-2 mb-1">{product.name}</h6>
            <p className="text-muted small">
              How would the customer like this cut?
            </p>
          </div>
          <div className="d-grid gap-2">
            {product.cuts.map((cut, idx) => (
              <button
                key={idx}
                className="btn btn-white border text-start px-3 d-flex justify-content-between align-items-center hover-bg-gray transition-all shadow-sm"
                onClick={() => onSelectCut(product, cut.name, cut.price)}
              >
                <div>
                  <span className="fw-medium">{cut.name}</span>
                  {cut.price > 0 && (
                    <span className="text-secondary small ms-2">
                      (+₹{cut.price})
                    </span>
                  )}
                </div>
                <i className="bi bi-chevron-right small text-secondary"></i>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CutSelectionModal;
