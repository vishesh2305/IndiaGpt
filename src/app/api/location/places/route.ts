import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/**
 * GET /api/location/places?query=<search>&lat=<latitude>&lng=<longitude>
 *
 * Searches for places using the Google Maps Places Text Search API.
 * Optionally biases results near the provided coordinates.
 *
 * Returns:
 *   {
 *     places: Array<{
 *       name: string;
 *       address: string;
 *       location: { lat: number; lng: number };
 *       rating: number | null;
 *       placeId: string;
 *     }>;
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
    const query = searchParams.get("query");

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: "Missing required query parameter: query" },
        { status: 400 }
      );
    }

    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const lat = latStr ? parseFloat(latStr) : null;
    const lng = lngStr ? parseFloat(lngStr) : null;

    // ── Google Maps Places API call ─────────────────────────────────────
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key is not configured on the server." },
        { status: 500 }
      );
    }

    const placesUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/textsearch/json"
    );
    placesUrl.searchParams.set("query", query.trim());
    placesUrl.searchParams.set("key", apiKey);
    placesUrl.searchParams.set("language", "en");

    // Bias results near user location if provided
    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      placesUrl.searchParams.set("location", `${lat},${lng}`);
      placesUrl.searchParams.set("radius", "50000"); // 50 km radius
    }

    const response = await fetch(placesUrl.toString());

    if (!response.ok) {
      console.error(
        "[Places] Google API HTTP error:",
        response.status,
        response.statusText
      );
      return NextResponse.json(
        { error: "Failed to reach the places service." },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.status === "ZERO_RESULTS") {
      return NextResponse.json({ places: [] });
    }

    if (data.status !== "OK") {
      console.error("[Places] Google API error status:", data.status);
      return NextResponse.json(
        { error: `Places API error: ${data.status}` },
        { status: 502 }
      );
    }

    // ── Transform results ───────────────────────────────────────────────

    interface GooglePlaceResult {
      name?: string;
      formatted_address?: string;
      geometry?: {
        location?: {
          lat: number;
          lng: number;
        };
      };
      rating?: number;
      place_id?: string;
    }

    const places = (data.results as GooglePlaceResult[])
      .filter(
        (place) => place.name && place.geometry?.location
      )
      .map((place) => ({
        name: place.name ?? "",
        address: place.formatted_address ?? "",
        location: {
          lat: place.geometry!.location!.lat,
          lng: place.geometry!.location!.lng,
        },
        rating: place.rating ?? null,
        placeId: place.place_id ?? "",
      }))
      .slice(0, 20); // Limit to 20 results

    return NextResponse.json({ places });
  } catch (error) {
    console.error("[Places] Unexpected error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
