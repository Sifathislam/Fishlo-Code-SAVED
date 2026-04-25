import {
    Autocomplete,
    GoogleMap,
    Marker,
    useJsApiLoader,
} from "@react-google-maps/api";
import {
    ArrowRight,
    LocateFixed,
    MapPin,
    Minus,
    Plus,
    Search,
    X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { DELIVERY_ZONES_GEOJSON } from "../shared/constants/deliveryZones";

const FISHLO_RED = "#d7574c";
const FISHLO_GRAY = "#393f4a";
const MY_API_KEY = import.meta.env.VITE_MAPS_API_KEY;
const LIBRARIES = ["places"];

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: false,
  clickableIcons: false,
  gestureHandling: "greedy",
};

export default function LocationModal({
  isOpen,
  onClose,
  onConfirm,
  mapCenter,
}) {
  const [map, setMap] = useState(null);
  const [markerPos, setMarkerPos] = useState(mapCenter);
  const [displayAddress, setDisplayAddress] = useState("");
  const [backendData, setBackendData] = useState(null);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [viewCenter, setViewCenter] = useState(mapCenter);
  const [locError, setLocError] = useState(null);

  // Ref to track label markers so we can remove them on cleanup
  const zoneMarkersRef = useRef([]);
  const autocompleteRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: MY_API_KEY,
    libraries: LIBRARIES,
  });

  useEffect(() => {
    if (isOpen) {
      setMarkerPos(mapCenter);
      setViewCenter(mapCenter);
      // Fetch the address string for these coordinates immediately
      if (isLoaded) {
        fetchAddress(mapCenter.lat, mapCenter.lng);
      }
    }
  }, [isOpen, mapCenter, isLoaded]);

  // --- HELPER: Extract Data ---
  const extractAddressData = useCallback((result, lat, lng) => {
    const components = result.address_components || [];
    const getComponent = (type) =>
      components.find((c) => c.types.includes(type))?.long_name || "";

    const cleanSymbolsOnly = (str) => {
      if (!str) return "";

      return (
        str
          // Remove Emojis and Unicode Symbols
          .replace(/[\p{Extended_Pictographic}\p{Symbol}]/gu, "")

          //  Remove any symbol NOT: letters, numbers, spaces, or - . , # / ( ) & +
          .replace(/[^a-zA-Z0-9\s\-\.,#/\(\)&\+]/g, "")

          //  FIX: Prevent 3+ consecutive special characters (Django error fix)
          // This looks for any non-alphanumeric character sequence of 3 or more and replaces with a single space
          .replace(/[^a-zA-Z0-9]{3,}/g, " ")

          // Cleanup whitespace (collapse double spaces and trim)
          .replace(/\s+/g, " ")
          .trim()
      );
    };

    const streetNumber = getComponent("street_number");
    const route = getComponent("route");
    const city =
      getComponent("locality") ||
      getComponent("sublocality_level_1") ||
      getComponent("administrative_area_level_2");

    let rawAddressLine1 = (streetNumber + " " + route).trim();
    if (!rawAddressLine1) {
      rawAddressLine1 = result.formatted_address.split(",")[0];
    }

    const payload = {
      address_line_2: cleanSymbolsOnly(result.formatted_address).substring(
        0,
        255
      ),
      city: cleanSymbolsOnly(city).substring(0, 100),
      state: cleanSymbolsOnly(
        getComponent("administrative_area_level_1")
      ).substring(0, 100),
      country: cleanSymbolsOnly(getComponent("country")),
      postal_code: getComponent("postal_code") || "",
      is_default: true,
      latitude: lat,
      longitude: lng,
    };

    setBackendData(payload);
    setDisplayAddress(result.formatted_address);
  }, []);

  // --- HELPER: Geocode ---
  const fetchAddress = async (lat, lng) => {
    try {
      setDisplayAddress("Locating...");
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MY_API_KEY}`
      );
      const data = await response.json();
      if (data.results?.length > 0) {
        extractAddressData(data.results[0], lat, lng);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setDisplayAddress("Error finding address");
    }
  };

  // --- EFFECT: Setup Delivery Zones & Labels ---
  useEffect(() => {
    if (map && isLoaded) {
      //  Cleanup old markers and data
      zoneMarkersRef.current.forEach((m) => m.setMap(null));
      zoneMarkersRef.current = [];
      map.data.forEach((feature) => map.data.remove(feature));

      //  Load GeoJSON
      const features = map.data.addGeoJson(DELIVERY_ZONES_GEOJSON);

      //  Style Zones
      map.data.setStyle({
        fillColor: FISHLO_RED,
        fillOpacity: 0.12,
        strokeWeight: 2,
        strokeColor: FISHLO_RED,
        strokeOpacity: 0.8,
        clickable: false,
      });

      //  Add Permanent Labels
      features.forEach((feature) => {
        const name = feature.getProperty("name");
        const geometry = feature.getGeometry();

        if (geometry?.getType() === "Polygon") {
          const bounds = new window.google.maps.LatLngBounds();
          geometry.getArray().forEach((path) => {
            path.getArray().forEach((latLng) => bounds.extend(latLng));
          });

          const labelMarker = new window.google.maps.Marker({
            position: bounds.getCenter(),
            map: map,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 0,
            },
            label: {
              text: name,
              color: FISHLO_RED,
              fontWeight: "bold",
              fontSize: "13px",
              className: "map-label-style", // Style this in your CSS
            },
          });
          zoneMarkersRef.current.push(labelMarker);
        }
      });
    }
  }, [map, isLoaded]);

  // --- HANDLERS ---
  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPos({ lat, lng });
    fetchAddress(lat, lng);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Not supported by browser");
      return;
    }

    setLoadingLoc(true);
    setLocError(null); // Reset error on new attempt

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMarkerPos(newPos);
        map?.panTo(newPos);
        map?.setZoom(17);
        fetchAddress(newPos.lat, newPos.lng);
        setLoadingLoc(false);
      },
      (error) => {
        setLoadingLoc(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocError("Location blocked. Please enable in browser settings.");
        } else {
          setLocError("Unable to retrieve location.");
        }

        // Auto-hide error after 4 seconds
        setTimeout(() => setLocError(null), 4000);
      }
    );
  };

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const newPos = { lat, lng };
      setMarkerPos(newPos); // Move Pin
      setViewCenter(newPos);
      map?.setZoom(17);
      extractAddressData(place, lat, lng);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal show fade d-block loc-modal-overlay">
      <div className="modal-dialog modal-dialog-centered modal-lg loc-modal-dialog">
        <div className="modal-content loc-modal-content">
          <div className="loc-map-wrapper">
            {isLoaded && (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={viewCenter} // Controlled by viewCenter state, not markerPos
                zoom={15}
                onLoad={setMap}
                onClick={handleMapClick}
                options={MAP_OPTIONS}
              >
                <Marker position={markerPos} />
              </GoogleMap>
            )}
          </div>

          <div className="loc-top-island-container">
            <div className="loc-search-card">
              <div className="loc-search-row">
                <Search size={20} className="text-muted me-2" />
                {isLoaded && (
                  <Autocomplete
                    onLoad={(ref) => (autocompleteRef.current = ref)}
                    onPlaceChanged={onPlaceChanged}
                    className="w-100"
                  >
                    <input
                      type="text"
                      className="form-control border-0 shadow-none loc-search-input"
                      placeholder="Search for your address..."
                    />
                  </Autocomplete>
                )}
              </div>
              <div className="loc-divider"></div>
              <div
                onClick={handleCurrentLocation}
                className="loc-current-location-btn"
              >
                <div
                  className={`d-flex align-items-center justify-content-center me-3 ${
                    loadingLoc ? "loc-spin-pulse" : ""
                  }`}
                >
                  <LocateFixed
                    size={24}
                    color={locError ? "#dc3545" : FISHLO_RED}
                  />
                </div>
                <div>
                  <h6
                    className="mb-0 mt-1 fw-medium"
                    style={{
                      fontSize: "15px",
                      color: locError ? "#dc3545" : "black",
                    }}
                  >
                    {loadingLoc
                      ? "Detecting location..."
                      : locError
                      ? locError
                      : "Use my current location"}
                  </h6>
                  {locError && (
                    <small
                      className="text-muted d-block"
                      style={{ fontSize: "11px" }}
                    >
                      Click the lock icon in your URL bar to reset
                    </small>
                  )}
                </div>
              </div>
            </div>

            <button onClick={onClose} className="loc-close-btn">
              <X size={24} color={FISHLO_GRAY} />
            </button>
          </div>

          <div className="loc-zoom-controls">
            <button
              onClick={() => map?.setZoom(map.getZoom() + 1)}
              className="loc-zoom-btn"
            >
              <Plus size={20} color={FISHLO_GRAY} />
            </button>
            <button
              onClick={() => map?.setZoom(map.getZoom() - 1)}
              className="loc-zoom-btn"
            >
              <Minus size={20} color={FISHLO_GRAY} />
            </button>
          </div>

          <div className="loc-bottom-card-container">
            <div className="loc-bottom-card">
              <div className="d-flex align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-3 overflow-hidden">
                  <div className="loc-address-icon-circle">
                    <MapPin size={24} color={FISHLO_RED} fill={FISHLO_RED} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="loc-label-text">Selected Location</p>
                    <h6 className="loc-address-text">
                      {displayAddress || "Tap on map to select"}
                    </h6>
                  </div>
                </div>

                <button
                  onClick={() => onConfirm(backendData)}
                  disabled={!backendData}
                  className="loc-confirm-btn"
                >
                  <span className="d-none d-sm-inline" style={{fontWeight: "600"}}>Confirm Location</span>
                  <span className="d-inline d-sm-none" style={{fontWeight: "600"}}>Confirm</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
