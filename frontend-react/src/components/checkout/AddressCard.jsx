import { Pencil } from "lucide-react";

function AddressCard({
  addr,
  selectedAddressId,
  setSelectedAddressId,
  handleEditClick,
  groupName = "delivery_address",
}) {
  return (
    <label className="selection-card-wrapper">
      <input
        type="radio"
        name={groupName}
        className="hidden-radio"
        value={addr.id}
        checked={selectedAddressId === addr.id}
        onChange={() => setSelectedAddressId(addr.id)}
      />
      <div className="selection-card">
        <div className="check-indicator">
          <i className="fa-solid fa-check"></i>
        </div>
        <div className="d-flex justify-content-between align-items-start">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="fw-medium text-dark name-text">
              {addr.recipient_name}
            </span>
            <span
              className={`badge-tag tag-${addr.address_type?.toLowerCase()}`}
            >
              {addr?.address_type_other
                ? addr?.address_type_other
                : addr.address_type}
            </span>
          </div>
          {/* Pass the addr object to handleEditClick */}
          <button
            type="button"
            className="btn-edit-address"
            onClick={(e) => {
              e.preventDefault();
              handleEditClick(addr);
            }}
          >
            <Pencil size={20} strokeWidth={1} />
          </button>
        </div>
        <p className="text-muted small mb-1 line-clamp-2 address-text">
          {addr.house_details}, {addr.address_line_2}, {addr.city}, {addr.state}{" "}
          - {addr.postal_code}
        </p>
        {addr.recipient_phone ? (
          <p className="text-dark small m-0 fw-medium">
            <i className="fa-solid fa-phone me-2 text-fishlo"></i>
            {addr.recipient_phone}
          </p>
        ) : (
          ""
        )}
      </div>
    </label>
  );
}

export default AddressCard;
