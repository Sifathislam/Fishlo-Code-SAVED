import AddressCard from "./AddressCard";

export default function AddressSelectionModal({
  addresses,
  selectedAddressId,
  setSelectedAddressId,
  handleEditClick,
 setShowAddressModal,
}) {
  const handleSelect = (id) => {
    setSelectedAddressId(id);
    setTimeout(() => {
      setShowAddressModal(false);
    }, 100);
  };

  const handleClose=()=>{
    setShowAddressModal(false)
  }

  return (
    <div className="custom-address-backdrop" onClick={handleClose}>
      <div
        className="custom-address-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="custom-address-header">
          <h5>Choose Delivery Address</h5>
          <button
            className="custom-address-close"
            onClick={handleClose}
            title="Close"
          />
        </div>

        <div className="custom-address-body">
          <div className="row g-3">
            {addresses.map((addr) => (
              <div className="col-md-6" key={addr.id}>
                <AddressCard
                  addr={addr}
                  groupName="modal_addresses"
                  selectedAddressId={selectedAddressId}
                  setSelectedAddressId={() => handleSelect(addr.id)}
                  handleEditClick={handleEditClick}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
