"use client";

import { useEffect, useCallback } from "react";
import { useLocationStore } from "@/store/location-store";

/** Maximum age of a cached position in milliseconds (5 minutes). */
const POSITION_MAX_AGE = 5 * 60 * 1000;
/** Timeout for geolocation requests in milliseconds (10 seconds). */
const POSITION_TIMEOUT = 10 * 1000;

/**
 * Reverse-geocodes coordinates into a city and state name using the
 * Google Maps Geocoding API.  Falls back to administrative area levels
 * to handle different response formats across regions.
 */
async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ city: string; state: string }> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("Google Maps API key is not configured");
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=en`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Reverse geocoding request failed");
  }

  const data = await res.json();

  if (data.status !== "OK" || !data.results?.length) {
    throw new Error(`Geocoding error: ${data.status}`);
  }

  let city = "";
  let state = "";

  // Walk through all results looking for the most specific locality
  for (const result of data.results) {
    for (const component of result.address_components) {
      const types: string[] = component.types;

      if (!city && types.includes("locality")) {
        city = component.long_name;
      }
      if (
        !city &&
        types.includes("administrative_area_level_2")
      ) {
        city = component.long_name;
      }
      if (
        !state &&
        types.includes("administrative_area_level_1")
      ) {
        state = component.long_name;
      }
    }

    // Stop once we have both
    if (city && state) break;
  }

  if (!city && !state) {
    // Last resort: use the formatted address of the first result
    const fallback = data.results[0]?.formatted_address ?? "";
    const parts = fallback.split(",").map((s: string) => s.trim());
    city = parts[0] ?? "Unknown";
    state = parts[1] ?? "Unknown";
  }

  return { city: city || "Unknown", state: state || "Unknown" };
}

/**
 * Maps the Permissions API status string to our store's permission type.
 */
function mapPermissionState(
  state: PermissionState
): "prompt" | "granted" | "denied" {
  switch (state) {
    case "granted":
      return "granted";
    case "denied":
      return "denied";
    default:
      return "prompt";
  }
}

/**
 * Custom hook for browser geolocation.
 *
 * - Checks permission status on mount
 * - Provides `requestLocation()` to prompt the user and retrieve coordinates
 * - Performs reverse geocoding to resolve city & state
 * - All state is synchronised with the Zustand location store
 */
export function useLocation() {
  const {
    coordinates,
    city,
    state,
    permissionStatus,
    isLoading,
    error,
    setCoordinates,
    setLocationInfo,
    setPermissionStatus,
    setIsLoading,
    setError,
    clearLocation,
  } = useLocationStore();

  // ── Check initial permission status on mount ───────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!navigator.geolocation) {
      setPermissionStatus("unavailable");
      return;
    }

    // The Permissions API is not available in all browsers
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          setPermissionStatus(mapPermissionState(result.state));

          // Listen for future permission changes (e.g. user revokes in settings)
          result.addEventListener("change", () => {
            setPermissionStatus(mapPermissionState(result.state));
          });
        })
        .catch(() => {
          // Permissions API not supported for geolocation — leave as "prompt"
        });
    }
  }, [setPermissionStatus]);

  // ── Request location ───────────────────────────────────────────────────
  const requestLocation = useCallback(async () => {
    if (typeof window === "undefined") return;

    if (!navigator.geolocation) {
      setPermissionStatus("unavailable");
      setError("Geolocation is not supported by this browser");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: POSITION_TIMEOUT,
            maximumAge: POSITION_MAX_AGE,
          });
        }
      );

      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setCoordinates(coords);
      setPermissionStatus("granted");

      // Reverse-geocode to get city and state
      try {
        const { city: resolvedCity, state: resolvedState } =
          await reverseGeocode(coords.lat, coords.lng);
        setLocationInfo(resolvedCity, resolvedState);
      } catch (geocodeError) {
        // We still have coordinates even if geocoding fails
        const message =
          geocodeError instanceof Error
            ? geocodeError.message
            : "Reverse geocoding failed";
        setError(message);
      }
    } catch (geoError) {
      if (geoError instanceof GeolocationPositionError) {
        switch (geoError.code) {
          case GeolocationPositionError.PERMISSION_DENIED:
            setPermissionStatus("denied");
            setError("Location permission denied");
            break;
          case GeolocationPositionError.POSITION_UNAVAILABLE:
            setError("Location information is unavailable");
            break;
          case GeolocationPositionError.TIMEOUT:
            setError("Location request timed out");
            break;
          default:
            setError("An unknown geolocation error occurred");
        }
      } else {
        setError("Failed to get location");
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    setCoordinates,
    setLocationInfo,
    setPermissionStatus,
    setIsLoading,
    setError,
  ]);

  return {
    requestLocation,
    clearLocation,
    isLoading,
    error,
    city,
    state,
    coordinates,
    permissionStatus,
    locationString: useLocationStore.getState().getLocationString(),
  };
}
