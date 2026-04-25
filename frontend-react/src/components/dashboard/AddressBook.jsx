import { useEffect } from "react";
import { useAddressBook } from "../../hooks/useAddressBook";
import AddressModal from "../AddressModal";
import LocationModal from "../LocationModal";
import Loader from "../../shared/components/Loader";

export default function AddressBook() {
  const {
    isPending,
    displayedAddresses,
    isSettingDefault,
    isDeleting,
    deletingId,
    isMapOpen,
    isAddressModalOpen,
    mapAddressData,
    setIsMapOpen,
    setIsAddressModalOpen,
    handleAddNewClick,
    handleMapConfirm,
    handleSwitchToMap,
    handleEditClick,
    handleDelete,
    getAddressIcon,
    setDefault,
    deleteError,
    resetDeleteError,
  } = useAddressBook();

  useEffect(() => {
    if (deleteError) {
      const timer = setTimeout(() => {
        resetDeleteError();
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [deleteError, resetDeleteError]);

  return (
    <div className="fade-in">
      <title>My Addresses | Fishlo</title>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="fw-medium mb-1"></h4>
        </div>
        {displayedAddresses.length >= 5 ? null : (
          <button className="btn btn-brand btn-sm" onClick={handleAddNewClick}>
            <i className="fas fa-plus "></i> Add New
          </button>
        )}
      </div>
      {displayedAddresses.length >= 5 ? (
        ""
      ) : (
        <p className="text-muted mb-0 mb-2" style={{ fontSize: "0.9rem" }}>
          You have saved {displayedAddresses.length}/5 allowed addresses.
        </p>
      )}

      {displayedAddresses.length >= 5 && (
        <div className="alert alert-warning mb-3" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Your address book is full (5/5). You need to delete an existing
          address to add a new one.
        </div>
      )}
      {deleteError && (
        <div className="flex-grow-1">
          <span className="fw-medium">Unable to delete address: </span>
          <span style={{ fontSize: "0.95rem" }}>
            {deleteError?.response?.data?.message ||
              "This is your default address. Please set another address as default before deleting this one."}
          </span>
        </div>
      )}

      <div className="row g-3">
        {isPending ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: "300px", width: "100%" }}
          >
            <Loader />
          </div>
        ) : displayedAddresses.length > 0 ? (
          displayedAddresses.map((addr) => (
            <div key={addr?.id} className="col-md-6">
              <div
                className={`card-custom p-3 h-100 position-relative ${
                  addr?.is_default ? "border-danger" : ""
                }`}
                style={addr?.is_default ? { borderWidth: "2px" } : {}}
              >
                <div className="position-absolute top-0 end-0 m-3">
                  {addr?.is_default ? (
                    <span className="badge bg-danger">Default</span>
                  ) : (
                    <button
                      className="btn btn-sm "
                      onClick={() => setDefault(addr.id)}
                      disabled={isSettingDefault}
                      style={{
                        color: "#dc3545",
                        border: "1.5px solid #dc3545",
                        backgroundColor: "transparent",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        padding: "4px 10px",
                      }}
                    >
                      <small>Set Default</small>
                    </button>
                  )}
                </div>

                <div className="d-flex align-items-center gap-3 mb-1">
                  <div
                    className="stat-icon bg-light text-dark d-flex align-items-center justify-content-center rounded-circle"
                    style={{
                      width: "40px",
                      height: "40px",
                      fontSize: "1rem",
                      flexShrink: 0,
                      marginBottom: "4px",
                    }}
                  >
                    <i
                      className={`fas ${getAddressIcon(addr?.address_type)}`}
                    ></i>
                  </div>
                  <h6 className="fw-medium mb-0 text-capitalize">
                    {addr?.address_type_other
                      ? addr?.address_type_other
                      : addr.address_type}
                  </h6>
                </div>
                <p className="text-dark fw-medium mb-1">
                  {addr.recipient_name}
                </p>
                <p className="text-muted small mb-1">
                  {addr?.house_details}, {addr?.address_line_2}, {addr?.city},{" "}
                  {addr?.state} - {addr?.postal_code}
                </p>
                <p className="text-muted small mb-2">
                  <i className="fas fa-phone me-2"></i>+91{" "}
                  {addr.recipient_phone}
                </p>

                <div className="d-flex gap-2 mt-auto">
                  <button
                    className="btn btn-sm btn-light border flex-fill"
                    onClick={() => handleEditClick(addr)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-light border text-danger flex-fill"
                    onClick={() => handleDelete(addr.id)}
                    // Disable if it's currently deleting OR if it's the default address
                    disabled={isDeleting || addr.is_default}
                    style={
                      addr.is_default
                        ? { cursor: "not-allowed", opacity: 0.6 }
                        : {}
                    }
                    title={
                      addr.is_default ? "Cannot delete default address" : ""
                    }
                  >
                    {isDeleting && deletingId === addr.id ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1"></span>
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-5">
            <i className="fas fa-map-marked-alt fa-3x text-light mb-3"></i>
            <p className="text-muted">
              No addresses found. Start by adding a new one!
            </p>
          </div>
        )}
      </div>
      <LocationModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirm={handleMapConfirm}
        mapCenter={
          mapAddressData?.latitude && mapAddressData?.longitude
            ? {
                lat: parseFloat(mapAddressData.latitude),
                lng: parseFloat(mapAddressData.longitude),
              }
            : { lat: 19.0845, lng: 73.0084 }
        }
      />
      <div className="fishlo-checkout-wrapper">
        <AddressModal
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          prefilledData={mapAddressData}
          onAddressCreatedOrUpdated={() => {}}
          onSwitchToMap={handleSwitchToMap}
        />
      </div>
    </div>
  );
}
