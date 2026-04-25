import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const OptionSelectionModal = ({
  show,
  onClose,
  product,
  onConfirm,
  checkStockLimit,
}) => {
  const [selectedCut, setSelectedCut] = useState(null);
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [customWeightInput, setCustomWeightInput] = useState("");
  const [customWeightUnit, setCustomWeightUnit] = useState("kg");
  const [retailPriceInput, setRetailPriceInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (product) {
      setRetailPriceInput(product.display_price || "");
    }
  }, [product]);

  if (!show || !product) return null;


  const hasCuts = product.cuts && product.cuts.length > 0;
  const hasWeights = product.weights && product.weights.length > 0;

  if (!hasCuts && !hasWeights) return null;

  const handleStandardWeightSelect = (weight) => {
    setSelectedWeight(weight);
    setCustomWeightInput(""); // Clear custom input
    setError("");
  };

  const handleCustomWeightChange = (val) => {
    setCustomWeightInput(val);
    setSelectedWeight(null); // Clear standard selection
    setError("");
  };

  const handleConfirm = () => {
    setError("");

    let finalWeight = selectedWeight;
    if (hasWeights) {
      if (!selectedWeight && !customWeightInput) {
        setError("Please select a weight option or enter a custom weight.");
        return;
      }
      if (customWeightInput && parseFloat(customWeightInput) > 0) {
        const value = parseFloat(customWeightInput);
        const weightKg = customWeightUnit === "kg" ? value : value / 1000;
        finalWeight = {
          id: "custom",
          weight: `${value} ${customWeightUnit}`,
          weight_kg: weightKg,
          price: 0, // Ignored logic for price addition unless cuts add price
        };
      } else if (customWeightInput) {
        setError("Please enter a valid custom weight.");
        return;
      }
    }

    if (hasCuts && !selectedCut) {
      setError("Please select a cut option.");
      return;
    }

    const check = checkStockLimit(product, 1, undefined, finalWeight);
    if (!check.allowed) {
      setError(check.message);
      return;
    }

    onConfirm({
      product,
      cut: selectedCut || { name: "Standard", price: 0 },
      weight: finalWeight || null,
      retailPrice: retailPriceInput ? parseFloat(retailPriceInput) : parseFloat(product.display_price || 0),
    });

    // Clear state
    onClose();
    setSelectedCut(null);
    setSelectedWeight(null);
    setCustomWeightInput("");
    setCustomWeightUnit("kg");
    setRetailPriceInput("");
    setError("");
  };

  return createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        zIndex: 10060,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
      }}
      // onClick={onClose}
    >
      <div
        className="bg-white rounded-4 shadow-lg p-0 overflow-hidden animate-zoom-in d-flex flex-column"
        style={{ width: "90%", maxWidth: "450px", maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
          <h6 className="fw-medium m-0 text-dark">Customize Item</h6>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <div className="p-4 overflow-auto custom-scrollbar">
          <div className="d-flex align-items-center gap-3 mb-4">
            <img
              src={product.featured_image || product.image || ""}
              className="rounded-3 shadow-sm object-fit-cover bg-light"
              width="60"
              height="60"
              alt=""
            />
            <div>
              <h6 className="fw-medium mb-1 line-clamp-2">{product.name}</h6>
              <div className="text-secondary small">
                Make your selection below
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="fw-medium small text-secondary mb-2 d-block">
              RETAIL PRICE (PER {hasWeights ? "KG" : "UNIT"})
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                placeholder="Enter retail price"
                value={retailPriceInput}
                onChange={(e) => {
                  if (e.target.value >= 0 || e.target.value === "") {
                    setRetailPriceInput(e.target.value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e") {
                    e.preventDefault();
                  }
                }}
              />
            </div>
          </div>

          {hasWeights && (
            <div className="mb-4">
              <label className="fw-medium small text-secondary mb-2 d-block">
                SELECT WEIGHT
              </label>
              <div className="row g-2 mb-3">
                {product.weights.map((weight) => (
                  <div key={weight.id} className="col-4">
                    <button
                      onClick={() => handleStandardWeightSelect(weight)}
                      className={`btn w-100 text-start p-2 d-flex justify-content-between align-items-center rounded-3 transition-all ${selectedWeight?.id === weight.id
                        ? "sd-btn-primary shadow-sm border-0 text-white"
                        : "bg-light border-0 text-dark hover-bg-gray"
                        }`}
                    >
                      <span className="fw-medium">{weight.weight}</span>
                      <div
                        className={`small ${selectedWeight?.id === weight.id ? "text-white-50" : "text-muted"}`}
                      >
                        <i
                          className={`bi ${selectedWeight?.id === weight.id ? "bi-check-circle-fill text-white" : "bi-circle"}`}
                        ></i>
                      </div>
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <label className="fw-medium small text-secondary mb-2 d-block">
                  OR ENTER CUSTOM WEIGHT
                </label>
                <div className="d-flex gap-2">
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    className="form-control"
                    placeholder="Enter custom weight"
                    value={customWeightInput}
                    onChange={(e) => {
                      if (e.target.value >= 0 || e.target.value === "") {
                        handleCustomWeightChange(e.target.value)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e") {
                        e.preventDefault();
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <select
                    className="form-select"
                    value={customWeightUnit}
                    onChange={(e) => {
                      setCustomWeightUnit(e.target.value);
                      setSelectedWeight(null);
                    }}
                    style={{ width: "90px" }}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {hasCuts && (
            <div className="mb-2">
              <label className="fw-medium small text-secondary mb-2 d-block">
                SELECT CUT
              </label>
              <div className="d-grid gap-1">
                {product.cuts.map((cut, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedCut(cut);
                      setError("");
                    }}
                    className={`btn text-start p-2 d-flex justify-content-between align-items-center rounded-3 transition-all ${selectedCut?.name === cut.name
                      ? "sd-btn-primary shadow-sm border-0"
                      : "bg-light border-0 text-dark hover-bg-gray"
                      }`}
                  >
                    <div>
                      <div className="fw-medium small">{cut.name}</div>
                      {cut.price > 0 && (
                        <div
                          className={`x-small ${selectedCut?.name === cut.name ? "text-white-50" : "text-secondary"}`}
                        >
                          +₹{cut.price}
                        </div>
                      )}
                    </div>
                    <i
                      className={`bi ${selectedCut?.name === cut.name ? "bi-check-circle-fill text-white" : "bi-circle text-muted"}`}
                    ></i>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-top bg-light">
          {error && (
            <div
              className="alert py-2 mb-3 small d-flex align-items-center rounded-3 border"
              style={{
                backgroundColor: "#fce8e8",
                borderColor: "#f5c6c6",
                color: "#c81e1e"
              }}
            >
              <i className="bi bi-exclamation-circle-fill me-2 fs-6"></i>
              {error}
            </div>
          )}
          <button
            className="btn sd-btn-primary w-100 py-3 fw-medium shadow-soft rounded-3"
            onClick={handleConfirm}
            disabled={
              (hasWeights && !selectedWeight && !customWeightInput) || 
              (hasCuts && !selectedCut) ||
              !retailPriceInput ||
              parseFloat(retailPriceInput) < 0
            }
          >
            Confirm & Add to Cart
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default OptionSelectionModal;
