import { useLocationManager } from "../../hooks/useLocationManager";
import LocationModal from "../LocationModal";
import SingleProductCard from "./SingleProductCard";

export default function Masala({ isLoading, data, fish }) {
  const {
    showLocationModal,
    setShowLocationModal,
    mapCenter,
    handleLocationConfirm,
  } = useLocationManager();
  //  const isLoading = true

  return (
    <>
      {showLocationModal && (
        <LocationModal
          isOpen={showLocationModal}
          mapCenter={mapCenter}
          onClose={() => setShowLocationModal(false)}
          onConfirm={handleLocationConfirm}
        />
      )}

      <section className="masala-fishlo-section mt-0 pt-0">
        {!fish ? (
          <img
            src="/marketing/fishlo_signature.svg"
            alt="Fishlo Signature Masala"
            className="fishlo_signature_banner"
          />
        ) : (
          ""
        )}

        <SingleProductCard
          data={data}
          setShowLocationModal={setShowLocationModal}
          isLoading={isLoading}
          fish={fish}
        />
      </section>
    </>
  );
}
