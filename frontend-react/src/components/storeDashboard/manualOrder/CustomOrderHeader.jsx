const CustomOrderHeader = ({
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  orderType,
  setOrderType,
  deliveryAddress,
  setShowAddressModal,
  phoneSuggestions,
  isPhoneSearchLoading,
  setShowPhoneSuggestions,
  handleSelectPhoneSuggestion,
}) => {
  return (
    <div
      className="bg-white border-bottom sticky-top shadow-sm px-3 px-lg-4 py-3"
      style={{ zIndex: 1000 }}
    >
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        {/* Brand & Title */}
        <div className="d-flex align-items-center gap-3">
          <div
            className="sd-bg-primary rounded-3 text-white d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: 40, height: 40 }}
          >
            <i className="bi bi-pencil-square fs-5"></i>
          </div>
          <div className="lh-1">
            <h6 className="fw-medium text-dark mb-0">Custom Order</h6>
            <span
              className="text-secondary small"
              style={{ fontSize: "0.7rem" }}
            >
              Manual Entry POS
            </span>
          </div>
        </div>

        {/* Customer Inputs (Unified Bar) - Responsive */}
        <div
          className="d-none d-md-flex flex-grow-1 align-items-center bg-light rounded-pill border px-3 py-1 mx-2 mx-xl-5"
          style={{ height: "50px" }}
        >
          {/* Order Type Select - DISABLED/HIDDEN for now (Force Walk-in) */}
          <div className="me-2 border-end pe-2">
            <button
              className="btn btn-sm fw-medium border-0 d-flex align-items-center gap-2 cursor-default text-nowrap"
              type="button"
              disabled
            >
              <i className="bi bi-shop text-dark"></i>
              Walk-in
            </button>
            {/* 
            <button
              className="btn btn-sm fw-medium border-0 dropdown-toggle d-flex align-items-center gap-2"
              type="button"
              data-bs-toggle="dropdown"
            >
              <i
                className={`bi ${orderType === "DELIVERY" ? "bi-truck sd-text-primary" : "bi-shop text-dark"}`}
              ></i>
              {orderType === "DELIVERY" ? "Home Delivery" : "Walk-in"}
            </button>
            <ul className="dropdown-menu shadow-sm border-0 mt-2 rounded-3">
              <li>
                <button
                  className="dropdown-item fw-medium small"
                  onClick={() => setOrderType("WALKIN")}
                >
                  <i className="bi bi-shop me-2"></i>Walk-in / Takeaway
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item fw-medium small"
                  onClick={() => setOrderType("DELIVERY")}
                >
                  <i className="bi bi-truck me-2 sd-text-primary"></i>Home
                  Delivery
                </button>
              </li>
            </ul>
             */}
          </div>

          <i className="bi bi-person text-secondary fs-5 mx-2"></i>
          <input
            type="text"
            className="form-control border-0 bg-transparent shadow-none fw-medium text-dark"
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <div className="vr mx-3 text-secondary opacity-25"></div>
          <span className="text-secondary fw-medium me-2">+91</span>
          <div className="position-relative" style={{ minWidth: "180px", maxWidth: "200px", flex: "1 0 auto" }}>
            <input
              type="text"
              className="form-control border-0 bg-transparent shadow-none fw-medium text-dark w-100"
              placeholder="Phone"
              maxLength={10}
              value={customerPhone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 10) {
                   setCustomerPhone(val);
                   setShowPhoneSuggestions(true);
                }
              }}
              onFocus={() => setShowPhoneSuggestions(true)}
              onBlur={() => setTimeout(() => setShowPhoneSuggestions(false), 200)}
            />
            {phoneSuggestions && phoneSuggestions.length > 0 && (
              <ul className="dropdown-menu show position-absolute w-100 shadow-sm border-0 mt-1" style={{ top: "100%", left: 0, zIndex: 1050, maxHeight: "200px", overflowY: "auto" }}>
                {phoneSuggestions.map((item, index) => (
                  <li key={index}>
                    <button
                      className="dropdown-item d-flex flex-column py-2"
                      onClick={() => handleSelectPhoneSuggestion(item)}
                      type="button"
                    >
                      <span className="fw-medium">{item.phone}</span>
                      {item.name && <small className="text-muted">{item.name}</small>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Address Input (Conditionally Visible) */}
          {orderType === "DELIVERY" && (
            <>
              <div className="vr mx-3 text-secondary opacity-25"></div>
              <div
                className="d-flex align-items-center gap-2 cursor-pointer group hover-bg-gray rounded-pill pe-3 transition-all"
                onClick={() => setShowAddressModal(true)}
              >
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 transition-all ${deliveryAddress ? "bg-success bg-opacity-10 text-success" : "bg-danger bg-opacity-10 text-danger"}`}
                  style={{ width: 32, height: 32 }}
                >
                  <i
                    className={`bi ${deliveryAddress ? "bi-geo-alt-fill" : "bi-plus-lg"}`}
                  ></i>
                </div>
                <div className="lh-sm">
                  {deliveryAddress ? (
                    <>
                      <div
                        className="fw-medium text-dark text-truncate"
                        style={{ maxWidth: "200px" }}
                      >
                        {deliveryAddress.house_details}
                      </div>
                      <div
                        className="text-secondary x-small text-truncate"
                        style={{ maxWidth: "200px" }}
                      >
                        {deliveryAddress.city}, {deliveryAddress.postal_code}
                      </div>
                    </>
                  ) : (
                    <div
                      className="fw-medium text-dark opacity-75 text-nowrap"
                      style={{ fontSize: "0.9rem" }}
                    >
                      Add Address
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mobile Toggle for Customer Inputs */}
        <div className="d-md-none ms-auto">
          <button
            className="btn btn-light rounded-circle border"
            onClick={() =>
              document
                .getElementById("mobile-customer-inputs")
                .classList.toggle("d-none")
            }
          >
            <i className="bi bi-person-lines-fill text-dark"></i>
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Inputs */}
      <div
        id="mobile-customer-inputs"
        className="d-none d-md-none mt-3 animate-fade-in border-top pt-3"
      >
        <div className="d-flex flex-column gap-2">
          {/* Segmented Toggle - HIDDEN (Force Walk-in) */}
          {/* <div className="bg-light p-1 rounded-pill d-flex relative">
                <button
                className={`btn flex-grow-1 rounded-pill fw-medium small transition-all ${orderType === "WALKIN" ? "sd-btn-primary shadow-sm" : "text-secondary border-0"}`}
                onClick={() => setOrderType("WALKIN")}
                >
                Walk-in
                </button>
                <button
                className={`btn flex-grow-1 rounded-pill fw-medium small transition-all ${orderType === "DELIVERY" ? "sd-btn-primary shadow-sm" : "text-secondary border-0"}`}
                onClick={() => setOrderType("DELIVERY")}
                >
                Delivery
                </button>
            </div> */}

          <div className="d-flex align-items-center bg-light rounded-3 px-3 py-2 border-0">
            <i className="bi bi-person text-secondary me-3 fs-5"></i>
            <input
              type="text"
              className="form-control bg-transparent border-0 p-0 shadow-none fw-medium text-dark"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="d-flex align-items-center bg-light rounded-3 px-3 py-2 border-0 position-relative">
            <span className="text-secondary fw-medium me-2">+91</span>
            <div className="vr me-3 opacity-25"></div>
            <input
              type="text"
              className="form-control bg-transparent border-0 p-0 shadow-none fw-medium text-dark w-100"
              placeholder="Phone Number"
              value={customerPhone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 10) {
                   setCustomerPhone(val);
                   setShowPhoneSuggestions(true);
                }
              }}
              onFocus={() => setShowPhoneSuggestions(true)}
              onBlur={() => setTimeout(() => setShowPhoneSuggestions(false), 200)}
            />
            {phoneSuggestions && phoneSuggestions.length > 0 && (
              <ul className="dropdown-menu show position-absolute w-100 shadow-sm border-0 mt-1" style={{ top: "100%", left: 0, zIndex: 1050, maxHeight: "200px", overflowY: "auto" }}>
                {phoneSuggestions.map((item, index) => (
                  <li key={index}>
                    <button
                      className="dropdown-item d-flex flex-column py-2"
                      onClick={() => handleSelectPhoneSuggestion(item)}
                      type="button"
                    >
                      <span className="fw-medium">{item.phone}</span>
                      {item.name && <small className="text-muted">{item.name}</small>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {orderType === "DELIVERY" && (
            <button
              className={`btn w-100 ${deliveryAddress ? "bg-success bg-opacity-10 text-success border-success border-opacity-25" : "bg-white sd-text-primary sd-border-primary dashed-border"} d-flex align-items-center justify-content-center gap-2 py-2 rounded-3 fw-medium transition-all`}
              onClick={() => setShowAddressModal(true)}
              style={{
                borderStyle: deliveryAddress ? "solid" : "dashed",
                borderWidth: "1px",
              }}
            >
              <i
                className={`bi ${deliveryAddress ? "bi-geo-alt-fill" : "bi-plus-lg"}`}
              ></i>
              {deliveryAddress
                ? "Edit Delivery Address"
                : "Add Delivery Address"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomOrderHeader;
