"use client";

import { useState, useCallback } from "react";
import { MapContainer } from "@/components/map/map-container";
import { MapSearch, type PlaceResult } from "@/components/map/map-search";
import { MapChatPanel } from "@/components/map/map-chat-panel";
import { MapControls } from "@/components/map/map-controls";
import { LocationPermission } from "@/components/map/location-permission";
import { useLocation } from "@/hooks/use-location";

/**
 * /map page
 *
 * Full-screen map experience with:
 * - MapContainer as the main area
 * - MapSearch floating at the top
 * - MapChatPanel on the right (desktop) / bottom (mobile)
 * - MapControls in the bottom-right
 * - LocationPermission overlay when needed
 *
 * Responsive layout:
 * - Desktop: side-by-side map + chat panel
 * - Mobile: full map with floating elements
 */
export default function MapPage() {
  const { coordinates, permissionStatus } = useLocation();

  // ── Map state ─────────────────────────────────────────────────────────

  const [mapCenter, setMapCenter] = useState<
    { lat: number; lng: number } | undefined
  >(undefined);
  const [mapZoom, setMapZoom] = useState<number | undefined>(undefined);
  const [mapType, setMapType] = useState("roadmap");
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [showPermission, setShowPermission] = useState(true);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleSearchResults = useCallback((places: PlaceResult[]) => {
    setSearchResults(places);

    // If there are results, centre on the first one
    if (places.length > 0) {
      setMapCenter(places[0].location);
      setMapZoom(13);
    }
  }, []);

  const handleSelectPlace = useCallback((place: PlaceResult) => {
    setMapCenter(place.location);
    setMapZoom(16);
  }, []);

  const handleCenterChange = useCallback(
    (center: { lat: number; lng: number }) => {
      setMapCenter(center);
    },
    []
  );

  const handleZoomChange = useCallback((zoom: number) => {
    setMapZoom(zoom);
  }, []);

  const handleMapTypeChange = useCallback((type: string) => {
    setMapType(type);
  }, []);

  const handleDismissPermission = useCallback(() => {
    setShowPermission(false);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ── Main Map ───────────────────────────────────────────────────── */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        mapTypeId={mapType}
        onCenterChanged={(center) => {
          // Only track for controls; don't create re-render loop
        }}
        onZoomChanged={(zoom) => {
          // Track for controls display
        }}
      />

      {/* ── Floating Search ────────────────────────────────────────────── */}
      <MapSearch
        onResults={handleSearchResults}
        onSelectPlace={handleSelectPlace}
        userLocation={coordinates}
      />

      {/* ── Map Controls ──────────────────────────────────────────────── */}
      <MapControls
        zoom={mapZoom ?? 5}
        onZoomChange={handleZoomChange}
        onCenterChange={handleCenterChange}
        onMapTypeChange={handleMapTypeChange}
        mapType={mapType}
      />

      {/* ── Chat Panel ────────────────────────────────────────────────── */}
      <MapChatPanel />

      {/* ── Location Permission Overlay ────────────────────────────────── */}
      {showPermission && permissionStatus === "prompt" && (
        <LocationPermission onDismiss={handleDismissPermission} />
      )}
    </div>
  );
}
