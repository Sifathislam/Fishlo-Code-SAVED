import React from 'react';

const CustomOrderForm = ({
  itemName, setItemName,
  itemWeight, setItemWeight,
  itemPricePerKg, setItemPricePerKg,
  itemCutPrice, setItemCutPrice,
  itemQuantity, setItemQuantity,
  itemNote, setItemNote,
  sellType, setSellType,
  addToCart
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    addToCart();
  };

  const isWeighted = sellType === "WEIGHT";
  const weightVal = parseFloat(itemWeight) || 0;
  const priceVal = parseFloat(itemPricePerKg) || 0;
  const cutPriceVal = parseFloat(itemCutPrice) || 0;
  const quantityVal = parseInt(itemQuantity) || 1;

  const calculatedTotal = isWeighted ? (weightVal * priceVal * quantityVal) : (quantityVal * priceVal);
  const finalTotal = calculatedTotal + (isWeighted ? cutPriceVal : 0);

  return (
    <div className="col-lg-8 p-4 overflow-auto custom-scrollbar bg-light">
      <div className="max-width-700 mx-auto">
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-3">
          <div className="card-header bg-white border-bottom-0 pt-3 px-3 pb-0">
            <h5 className="fw-bold text-dark mb-0 fs-6">Add Custom Product</h5>
            <p className="text-secondary mb-1" style={{fontSize: "0.75rem"}}>Enter product details manually to add to cart</p>
          </div>
          <div className="card-body p-3 pt-2">
            <form onSubmit={handleSubmit} className="row gy-2 gx-3">
              {/* Product Type Toggle */}
              <div className="col-12 mt-1">
                <label className="form-label fw-medium text-secondary mb-1 d-block" style={{fontSize: "0.7rem"}}>Selling Type</label>
                <div className="btn-group w-100 shadow-soft rounded-3 overflow-hidden p-1 bg-light border" role="group">
                  <button
                    type="button"
                    className={`btn btn-sm py-1 border-0 rounded-2 fw-semibold transition-all ${isWeighted ? 'btn-primary shadow-sm' : 'text-secondary'}`}
                    onClick={() => setSellType("WEIGHT")}
                  >
                    <i className="bi bi-scale me-2"></i>Weighted
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm py-1 border-0 rounded-2 fw-semibold transition-all ${!isWeighted ? 'btn-primary shadow-sm' : 'text-secondary'}`}
                    onClick={() => setSellType("PIECE")}
                  >
                    <i className="bi bi-box me-2"></i>Pieces
                  </button>
                </div>
              </div>

              <div className="col-12">
                <label className="form-label fw-medium text-secondary mb-1" style={{fontSize: "0.7rem"}}>Product Name</label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white border-end-0 text-secondary">
                    <i className="bi bi-tag"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0 shadow-none"
                    placeholder="Name"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {isWeighted && (
                <div className="col-md-6">
                  <label className="form-label fw-medium text-secondary mb-1" style={{fontSize: "0.7rem"}}>Weight (kg)</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-end-0 text-secondary font-monospace small">KG</span>
                    <input
                      type="number"
                      step="0.001"
                      className="form-control border-start-0 ps-0 shadow-none"
                      placeholder="0.000"
                      value={itemWeight}
                      onChange={(e) => setItemWeight(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="col-md-6">
                <label className="form-label fw-medium text-secondary mb-1" style={{fontSize: "0.7rem"}}>Price per {isWeighted ? 'kg' : 'piece'}</label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white border-end-0 text-secondary">₹</span>
                  <input
                    type="number"
                    className="form-control border-start-0 ps-0 shadow-none"
                    placeholder="0"
                    value={itemPricePerKg}
                    onChange={(e) => setItemPricePerKg(e.target.value)}
                    required
                  />
                </div>
              </div>

              {isWeighted && (
                <div className="col-md-6">
                  <label className="form-label fw-medium text-secondary mb-1" style={{fontSize: "0.7rem"}}>Cut Price (Fixed)</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-end-0 text-secondary">₹</span>
                    <input
                      type="number"
                      className="form-control border-start-0 ps-0 shadow-none"
                      placeholder="0 (Optional)"
                      value={itemCutPrice}
                      onChange={(e) => setItemCutPrice(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="col-md-6">
                <label className="form-label fw-medium text-secondary mb-1" style={{fontSize: "0.7rem"}}>Quantity {isWeighted ? '' : '(Total Pieces)'}</label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white border-end-0 text-secondary">
                    <i className="bi bi-hash"></i>
                  </span>
                  <input
                    type="number"
                    min="1"
                    className="form-control border-start-0 ps-0 shadow-none"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                    onBlur={() => { if (!itemQuantity || itemQuantity < 1) setItemQuantity(1); }}
                    required
                  />
                </div>
              </div>

              {isWeighted && (
                <div className="col-12">
                  <label className="form-label fw-medium text-secondary mb-1" style={{fontSize: "0.7rem"}}>
                    Cuts Name / Note {parseFloat(itemCutPrice) > 0 && <span className="text-danger">*</span>}
                  </label>
                  <textarea
                    className="form-control form-control-sm shadow-none"
                    rows="2"
                    placeholder="e.g. Clean cut, no head etc."
                    value={itemNote}
                    onChange={(e) => setItemNote(e.target.value)}
                    required={parseFloat(itemCutPrice) > 0}
                  ></textarea>
                </div>
              )}

              <div className="col-12 mt-2">
                <div className="d-flex align-items-center justify-content-between p-3 bg-primary bg-opacity-10 rounded-3 border border-primary border-opacity-10 mb-3">
                  <div className="lh-1">
                    <span className="text-secondary x-small d-block mb-1">Calculated Item Total</span>
                    <span className="fw-bold text-primary fs-5">₹{finalTotal.toLocaleString()}</span>
                  </div>
                  <div className="text-secondary small">
                    {isWeighted ? (
                      <>
                        {itemQuantity > 1 ? `(${itemQuantity} × ${itemWeight || 0}kg)` : `${itemWeight || 0}kg`} × ₹{itemPricePerKg || 0}/kg
                        {itemCutPrice > 0 && ` + ₹${itemCutPrice} cut`}
                      </>
                    ) : (
                      <>
                        {itemQuantity || 0} pcs × ₹{itemPricePerKg || 0}/pc
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn sd-btn-primary w-100 py-3 rounded-3 fw-bold shadow-soft d-flex align-items-center justify-content-center gap-2"
                  disabled={!itemName || (isWeighted && !itemWeight) || !itemPricePerKg || (parseFloat(itemCutPrice) > 0 && !(itemNote && itemNote.trim()))}
                >
                  <i className="bi bi-plus-circle-fill"></i> Add to Order List
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Info Box */}
        <div className="alert bg-white border shadow-sm rounded-4 d-flex gap-3 p-3">
            <div className="bg-warning bg-opacity-10 text-warning px-3 py-2 rounded-3 h-fit-content">
                <i className="bi bi-info-circle-fill fs-5"></i>
            </div>
            <div>
                <h6 className="fw-bold text-dark mb-1 small">Custom Order Note</h6>
                <p className="text-secondary x-small m-0">
                    Custom products allow you to sell items that are not in the official catalog. 
                    Be careful with pricing and weights as these are not validated against system stock.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CustomOrderForm;
