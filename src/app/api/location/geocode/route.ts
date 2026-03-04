import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/**
 * GET /api/location/geocode?lat=<latitude>&lng=<longitude>
 *
 * Reverse-geocodes a latitude/longitude pair into a human-readable
 * address using the Google Maps Geocoding API.
 *
 * Returns:
 *   {
 *     city: string;
 *     state: string;
 *     formattedAddress: string;
 *   }
 */
export async function GET(request: NextRequest) {
  try {
    // ── Authentication ──────────────────────────────────────────────────
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // ── Parse query parameters ──────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: "Missing required query parameters: lat, lng" },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "Invalid coordinates. lat and lng must be numbers." },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: "Coordinates out of range. lat: [-90, 90], lng: [-180, 180]." },
        { status: 400 }
      );
    }

    // ── Google Maps Geocoding API call ──────────────────────────────────
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key is not configured on the server." },
        { status: 500 }
      );
    }

    const geocodeUrl = new URL(
      "https://maps.googleapis.com/maps/api/geocode/json"
    );
    geocodeUrl.searchParams.set("latlng", `${lat},${lng}`);
    geocodeUrl.searchParams.set("key", apiKey);
    geocodeUrl.searchParams.set("language", "en");

    const response = await fetch(geocodeUrl.toString());

    if (!response.ok) {
      console.error(
        "[Geocode] Google API HTTP error:",
        response.status,
        response.statusText
      );
      return NextResponse.json(
        { error: "Failed to reach the geocoding service." },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.results?.length) {
      return NextResponse.json(
        {
          error: `Geocoding failed with status: ${data.status}`,
          city: null,
          state: null,
          formattedAddress: null,
        },
        { status: 200 }
      );
    }

    // ── Extract city and state ──────────────────────────────────────────

    let city = "";
    let state = "";
    let formattedAddress = data.results[0]?.formatted_address ?? "";

    for (const result of data.results) {
      for (const component of result.address_components) {
        const types: string[] = component.types;

        if (!city && types.includes("locality")) {
          city = component.long_name;
        }
        if (!city && types.includes("administrative_area_level_2")) {
          city = component.long_name;
        }
        if (!state && types.includes("administrative_area_level_1")) {
          state = component.long_name;
        }
      }

      if (city && state) break;
    }

    // Fallback: parse from formatted address
    if (!city && !state) {
      const parts = formattedAddress.split(",").map((s: string) => s.trim());
      city = parts[0] ?? "";
      state = parts[1] ?? "";
    }

    return NextResponse.json({
      city: city || null,
      state: state || null,
      formattedAddress,
    });
  } catch (error) {
    console.error("[Geocode] Unexpected error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
