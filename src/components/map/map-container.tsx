"use client";

import { useEffect, useState, useCallback } from "react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { cn } from "@/lib/utils";
import { useLocation } from "@/hooks/use-location";

// ── Default map centre: geographic centre of India ──────────────────────────

const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };
const DEFAULT_ZOOM = 5;
const USER_LOCATION_ZOOM = 12;

// ── Google Maps styling for a clean, India-focused appearance ───────────────

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "simplified" }],
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "simplified" }],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#c9e6f0" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry.fill",
    stylers: [{ color: "#f5f5f0" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#ffcc80" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#FF9933" }],
  },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#138808", weight: 2 }],
  },
];

// ── Props ───────────────────────────────────────────────────────────────────

interface MapContainerProps {
  /** Override the initial centre. If not provided, uses user location or India centre. */
  center?: { lat: number; lng: number };
  /** Override the initial zoom level. */
  zoom?: number;
  /** Map type ID: "roadmap", "satellite", "hybrid", "terrain". */
  mapTypeId?: string;
  /** Child components (markers, overlays, etc.) rendered inside the Map. */
  children?: React.ReactNode;
  /** Additional class names for the container div. */
  className?: string;
  /** Callback when map centre changes. */
  onCenterChanged?: (center: { lat: number; lng: number }) => void;
  /** Callback when zoom level changes. */
  onZoomChanged?: (zoom: number) => void;
}

/**
 * Google Maps wrapper centred on India by default.
 *
 * Uses the `@vis.gl/react-google-maps` library with the Google Maps
 * JavaScript API. If the user's location is available (via the
 * `useLocation` hook), the map re-centres on their position.
 */
export function MapContainer({
  center: centerProp,
  zoom: zoomProp,
  mapTypeId = "roadmap",
  children,
  className,
  onCenterChanged,
  onZoomChanged,
}: MapContainerProps) {
  const { coordinates } = useLocation();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  // ── Determine initial centre and zoom ─────────────────────────────────

  const [mapCenter, setMapCenter] = useState(
    centerProp ?? (coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : INDIA_CENTER)
  );
  const [mapZoom, setMapZoom] = useState(
    zoomProp ?? (coordinates ? USER_LOCATION_ZOOM : DEFAULT_ZOOM)
  );

  // Re-centre when user location becomes available (only once)
  const [hasRecentered, setHasRecentered] = useState(false);

  useEffect(() => {
    if (coordinates && !hasRecentered && !centerProp) {
      setMapCenter({ lat: coordinates.lat, lng: coordinates.lng });
      setMapZoom(USER_LOCATION_ZOOM);
      setHasRecentered(true);
    }
  }, [coordinates, hasRecentered, centerProp]);

  // Sync external centre prop changes
  useEffect(() => {
    if (centerProp) {
      setMapCenter(centerProp);
    }
  }, [centerProp]);

  useEffect(() => {
    if (zoomProp !== undefined) {
      setMapZoom(zoomProp);
    }
  }, [zoomProp]);

  // ── Event handlers ────────────────────────────────────────────────────

  const handleCenterChanged = useCallback(
    (event: { detail: { center: { lat: number; lng: number } } }) => {
      const newCenter = event.detail.center;
      if (newCenter) {
        onCenterChanged?.(newCenter);
      }
    },
    [onCenterChanged]
  );

  const handleZoomChanged = useCallback(
    (event: { detail: { zoom: number } }) => {
      const newZoom = event.detail.zoom;
      if (newZoom !== undefined) {
        onZoomChanged?.(newZoom);
      }
    },
    [onZoomChanged]
  );

  // ── Guard: no API key ─────────────────────────────────────────────────

  if (!apiKey) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-muted/30",
          className
        )}
      >
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Google Maps API key is not configured.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Set <code className="rounded bg-muted px-1 py-0.5 text-[11px]">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full", className)}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={mapCenter}
          defaultZoom={mapZoom}
          center={mapCenter}
          zoom={mapZoom}
          mapTypeId={mapTypeId}
          gestureHandling="greedy"
          disableDefaultUI={true}
          zoomControl={false}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          styles={MAP_STYLES}
          onCenterChanged={handleCenterChanged as never}
          onZoomChanged={handleZoomChanged as never}
          className="h-full w-full"
        >
          {children}
        </Map>
      </APIProvider>
    </div>
  );
}
