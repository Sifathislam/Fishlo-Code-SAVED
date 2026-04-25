import { createPortal } from "react-dom";

const AddressModal = ({
  show,
  onClose,
  deliveryAddress,
  setDeliveryAddress,
}) => {
  if (!show) return null;

  return createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        zIndex: 10060,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="bg-white rounded-4 shadow-lg overflow-hidden animate-zoom-in"
        style={{ width: "90%", maxWidth: "550px" }}
      >
        <div className="bg-light p-4 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-white p-2 rounded-circle shadow-sm">
              <i className="bi bi-geo-alt-fill sd-text-primary fs-5"></i>
            </div>
            <div>
              <h5 className="fw-medium m-0 text-dark">Delivery Details</h5>
              <p className="text-secondary small m-0">
                Where should we deliver this order?
              </p>
            </div>
            <button className="btn-close ms-auto" onClick={onClose}></button>
          </div>
        </div>

        <form
          className="p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const addressData = Object.fromEntries(formData.entries());
            setDeliveryAddress(addressData); // Save structured data
            onClose();
          }}
        >
          <div className="row g-3">
            <div className="col-12">
              <div className="form-floating">
                <input
                  name="house_details"
                  id="house"
                  defaultValue={deliveryAddress?.house_details}
                  className="form-control bg-light border-0 fw-medium"
                  placeholder="Flat No"
                  required
                />
                <label htmlFor="house" className="text-secondary">
                  Flat / House No / Building
                </label>
              </div>
            </div>

            <div className="col-12">
              <div className="form-floating">
                <input
                  name="address_line_2"
                  id="street"
                  defaultValue={deliveryAddress?.address_line_2}
                  className="form-control bg-light border-0 fw-medium"
                  placeholder="Street"
                  required
                />
                <label htmlFor="street" className="text-secondary">
                  Street / Area / Colony
                </label>
              </div>
            </div>

            <div className="col-md-6">
              <div className="form-floating">
                <input
                  name="city"
                  id="city"
                  defaultValue={deliveryAddress?.city}
                  className="form-control bg-light border-0 fw-medium"
                  placeholder="City"
                  required
                />
                <label htmlFor="city" className="text-secondary">
                  City
                </label>
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-floating">
                <input
                  name="postal_code"
                  id="pincode"
                  defaultValue={deliveryAddress?.postal_code}
                  className="form-control bg-light border-0 fw-medium"
                  placeholder="Pincode"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
                <label htmlFor="pincode" className="text-secondary">
                  Pincode
                </label>
              </div>
            </div>

            <div className="col-12">
              <div className="form-floating">
                <input
                  name="landmark"
                  id="landmark"
                  defaultValue={deliveryAddress?.landmark}
                  className="form-control bg-light border-0 fw-medium"
                  placeholder="Landmark"
                />
                <label htmlFor="landmark" className="text-secondary">
                  Landmark (Optional)
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2">
            <button
              type="submit"
              className="btn sd-btn-primary w-100 py-3 fw-medium rounded-3 shadow-soft"
            >
              Confirm Delivery Address
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default AddressModal;
