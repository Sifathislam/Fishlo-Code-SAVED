const DeliverySlotSelection = ({
  slotsData,
  deliveryDay,
  setDeliveryDay,
  deliverySlotId,
  setDeliverySlotId,
  isSlotsError,
  slotsError,
  slotValidationError,
}) => {


  return (
    <div id="delivery-slots-section" className="modern-card mb-3 mb-md-4">
      <div className="card-header-clean">
        <div className="d-flex align-items-center">
          <div className="icon-box me-3">
            <i className="fa-regular fa-clock"></i>
          </div>
          <div>
            <h5 className="section-title">Schedule Your Delivery</h5>
          </div>
        </div>
      </div>
      <div className="card-body">
        {slotValidationError && (
          <div className="alert alert-danger mb-3 py-2" role="alert">
            <i className="fa-solid fa-circle-exclamation me-2"></i>
            {slotValidationError}
          </div>
        )}
        {isSlotsError ? (
          <div className="alert alert-danger mb-0" role="alert">
            <i className="fa-solid fa-circle-exclamation me-2"></i>
            {slotsError?.response?.data?.message ||
              slotsError?.message ||
              "Failed to load delivery slots. Please try again later."}
          </div>
        ) : slotsData ? (
          <>
            {/* Date Tabs */}
            <div className="d-flex mb-3 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryDay("TODAY")}
                className={`btn px-4 ${deliveryDay === "TODAY"
                  ? "text-white shadow-sm"
                  : "btn-outline-secondary border-light text-muted bg-light"
                  }`}
                style={{
                  backgroundColor:
                    deliveryDay === "TODAY" ? "#e4645a" : "transparent",
                  borderColor: deliveryDay === "TODAY" ? "#e4645a" : "#f8f9fa",
                  borderRadius: "8px",
                  fontWeight: "400",
                  transition: "all 0.2s",
                }}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deliveryDay !== "TOMORROW") {
                    setDeliveryDay("TOMORROW");
                  }
                }}
                className={`btn px-4 ${deliveryDay === "TOMORROW"
                  ? "text-white shadow-sm"
                  : "btn-outline-secondary border-light text-muted bg-light"
                  }`}
                style={{
                  backgroundColor:
                    deliveryDay === "TOMORROW" ? "#e4645a" : "transparent",
                  borderColor:
                    deliveryDay === "TOMORROW" ? "#e4645a" : "#f8f9fa",
                  borderRadius: "8px",
                  fontWeight: "400",
                  transition: "all 0.2s",
                }}
              >
                Tomorrow
              </button>
            </div>

            {/* Slots Grid */}
            <div
              className="row g-2"
              style={{ maxHeight: "300px", overflowY: "auto" }}
            >
              {(() => {
                const currentSlots =
                  deliveryDay === "TODAY"
                    ? slotsData?.data?.today?.slots
                    : slotsData?.data?.tomorrow?.slots;

                if (!currentSlots || currentSlots.length === 0) {
                  return (
                    <div className="col-12 text-center py-4">
                      <p className="text-muted mb-0">
                        No delivery slots available for{" "}
                        {deliveryDay === "TODAY" ? "today" : "tomorrow"}.
                      </p>
                    </div>
                  );
                }

                return currentSlots.map((slot) => {
                  const isSelected = deliverySlotId === slot.id;
                  const isAvailable = slot.is_active;
                  const isPassed = slot.reason === "Passed";

                  return (
                    <div
                      className="col-4 col-sm-2"
                      key={`${deliveryDay}-${slot.id}`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          isAvailable && setDeliverySlotId(slot.id)
                        }
                        disabled={!isAvailable}
                        className={`btn w-100 p-2 text-start position-relative d-flex flex-column justify-content-center ${isSelected ? "" : "btn-light border-light"
                          }`}
                        style={{
                          minHeight: "40px",
                          borderRadius: "8px",
                          // INCREASED BORDER WIDTH AND DARKENED UNSELECTED COLOR
                          border: isSelected
                            ? "2px solid #e4645a"
                            : "2px solid #e0e0e0",
                          backgroundColor: isSelected
                            ? "rgba(228, 100, 90, 0.08)"
                            : isPassed
                              ? "#f8f9fa"
                              : "#fff",
                          opacity: isPassed || !isAvailable ? 0.6 : 1,
                          cursor: isAvailable ? "pointer" : "not-allowed",
                          color: isSelected ? "#e4645a" : "inherit",
                          // OPTIONAL: Add a subtle transition for a smoother look when clicked
                          transition: "all 0.2s ease-in-out",
                        }}
                      >
                        <div
                          className={`fw-normal ${isSelected ? "" : "text-dark"}`}
                          style={{
                            fontSize: "0.75rem",
                            color: isSelected ? "#e4645a" : "inherit",
                            // Optional: make selected text slightly bolder to match the thicker border
                            fontWeight: isSelected ? "500" : "normal",
                          }}
                        >
                          {slot.label}
                        </div>
                        {slot.reason && (
                          <div
                            className={`${isPassed ? "text-muted" : "text-danger"} small fw-normal`}
                            style={{ fontSize: "0.75rem" }}
                          >
                            {slot.reason}
                          </div>
                        )}
                        {isSelected && (
                          <div
                            className="position-absolute top-0 end-0 m-1"
                            style={{ fontSize: "0.8rem", color: "#e4645a" }}
                          >
                            <i className="fa-solid fa-circle-check"></i>
                          </div>
                        )}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-muted">
            Loading available slots...
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliverySlotSelection;
