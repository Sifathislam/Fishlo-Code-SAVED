
const BillingAddress = ({
  sameAsDelivery,
  setSameAsDelivery,
  billingAddress,
  onBillingChange,
  billingErrors,
}) => {
  return (
    <div className="mb-3 mb-md-4">
      <div className="form-check custom-switch mb-0">
        <input
          className="form-check-input"
          type="checkbox"
          id="sameAsDelivery"
          checked={sameAsDelivery}
          onChange={(e) => setSameAsDelivery(e.target.checked)}
          style={{ padding: "8px", marginTop: "2px" }}
        />
        <label
          className="form-check-label fw-normal ms-2 "
          htmlFor="sameAsDelivery"
        >
          Billing address same as delivery address
        </label>
      </div>

      {!sameAsDelivery && (
        <div className="mt-3 animate-fade-in">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="form-floating-custom">
                <label>Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  className="form-control"
                  placeholder="John Doe"
                  maxLength={25}
                  value={billingAddress.full_name}
                  onChange={onBillingChange}
                />
              </div>
              {billingErrors.full_name && (
                <div className="text-danger small">
                  {billingErrors.full_name}
                </div>
              )}
            </div>
            <div className="col-md-6">
              <div className="form-floating-custom">
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  className="form-control"
                  placeholder="+91..."
                  maxLength={11}
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, "");
                  }}
                  value={billingAddress.phone}
                  onChange={onBillingChange}
                />
              </div>
              {billingErrors.phone && (
                <div className="text-danger small">
                  {billingErrors.phone}
                </div>
              )}
            </div>
            <div className="col-12">
              <div className="form-floating-custom">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="name@example.com"
                  value={billingAddress.email}
                  onChange={onBillingChange}
                />
              </div>
            </div>
            <div className="col-12">
              <div className="form-floating-custom">
                <label>Address</label>
                <input
                  type="text"
                  name="house_details"
                  className="form-control"
                  placeholder="Street address"
                  maxLength={250}
                  value={billingAddress.house_details}
                  onChange={onBillingChange}
                />
              </div>
              {billingErrors.house_details && (
                <div className="text-danger small">
                  {billingErrors.house_details}
                </div>
              )}
            </div>
            <div className="col-6 col-md-4">
              <div className="form-floating-custom">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  className="form-control"
                  maxLength={50}
                  value={billingAddress.city}
                  onChange={onBillingChange}
                />
              </div>
              {billingErrors.city && (
                <div className="text-danger small">
                  {billingErrors.city}
                </div>
              )}
            </div>
            <div className="col-6 col-md-4">
              <div className="form-floating-custom">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  className="form-control"
                  maxLength={50}
                  value={billingAddress.state}
                  onChange={onBillingChange}
                />
              </div>
              {billingErrors.state && (
                <div className="text-danger small">
                  {billingErrors.state}
                </div>
              )}
            </div>
            <div className="col-md-4">
              <div className="form-floating-custom">
                <label>Pincode</label>
                <input
                  type="text"
                  name="postal_code"
                  className="form-control"
                  maxLength={6}
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, "");
                  }}
                  value={billingAddress.postal_code}
                  onChange={onBillingChange}
                />
              </div>
              {billingErrors.postal_code && (
                <div className="text-danger small">
                  {billingErrors.postal_code}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingAddress;
