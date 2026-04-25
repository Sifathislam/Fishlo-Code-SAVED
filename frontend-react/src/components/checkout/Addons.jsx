import { useLocationManager } from "../../hooks/useLocationManager";
import SingleProductCard from "../details/SingleProductCard";
import RelatedProductsSkeleton from "../detailsSkeleton/RelatedProductsSkeleton";
import LocationModal from "../LocationModal";

export default function Addons({ isLoading, data }) {
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

      <section className="masala-fishlo-section pb-4 mt-0 pt-0">
        {isLoading ? (
          <RelatedProductsSkeleton />
        ) : (
          <SingleProductCard
            data={data}
            setShowLocationModal={setShowLocationModal}
            isLoading={isLoading}
            addons="addons"
          />
        )}
      </section>
    </>
  );
}
