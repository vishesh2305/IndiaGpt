import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/**
 * GET /api/location/directions?origin=<origin>&destination=<destination>&mode=<mode>
 *
 * Fetches directions between two points using the Google Maps
 * Directions API.
 *
 * Parameters:
 *   - origin:      Starting point (address string or "lat,lng")
 *   - destination:  End point (address string or "lat,lng")
 *   - mode:        Travel mode: "driving" | "walking" | "bicycling" | "transit"
 *                  Defaults to "driving".
 *
 * Returns:
 *   {
 *     distance: string;        // e.g. "145 km"
 *     duration: string;        // e.g. "2 hours 15 mins"
 *     startAddress: string;
 *     endAddress: string;
 *     steps: Array<{
 *       instruction: string;   // HTML stripped
 *       distance: string;
 *       duration: string;
 *     }>;
 *     polyline: string;        // Encoded polyline for rendering on map
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
    const origin = searchParams.get("origin");
    const destination = searchParams.get("destination");
    const mode = searchParams.get("mode") ?? "driving";

    if (!origin || !origin.trim()) {
      return NextResponse.json(
        { error: "Missing required query parameter: origin" },
        { status: 400 }
      );
    }

    if (!destination || !destination.trim()) {
      return NextResponse.json(
        { error: "Missing required query parameter: destination" },
        { status: 400 }
      );
    }

    const validModes = ["driving", "walking", "bicycling", "transit"];
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        {
          error: `Invalid mode "${mode}". Valid modes: ${validModes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // ── Google Maps Directions API call ─────────────────────────────────
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key is not configured on the server." },
        { status: 500 }
      );
    }

    const directionsUrl = new URL(
      "https://maps.googleapis.com/maps/api/directions/json"
    );
    directionsUrl.searchParams.set("origin", origin.trim());
    directionsUrl.searchParams.set("destination", destination.trim());
    directionsUrl.searchParams.set("mode", mode);
    directionsUrl.searchParams.set("key", apiKey);
    directionsUrl.searchParams.set("language", "en");
    directionsUrl.searchParams.set("region", "in"); // Bias towards India

    const response = await fetch(directionsUrl.toString());

    if (!response.ok) {
      console.error(
        "[Directions] Google API HTTP error:",
        response.status,
        response.statusText
      );
      return NextResponse.json(
        { error: "Failed to reach the directions service." },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.status === "NOT_FOUND") {
      return NextResponse.json(
        { error: "Could not find one or both of the specified locations." },
        { status: 404 }
      );
    }

    if (data.status === "ZERO_RESULTS") {
      return NextResponse.json(
        {
          error: `No ${mode} route found between the specified locations.`,
        },
        { status: 404 }
      );
    }

    if (data.status !== "OK") {
      console.error("[Directions] Google API error status:", data.status);
      return NextResponse.json(
        { error: `Directions API error: ${data.status}` },
        { status: 502 }
      );
    }

    // ── Transform response ──────────────────────────────────────────────

    const route = data.routes?.[0];
    const leg = route?.legs?.[0];

    if (!route || !leg) {
      return NextResponse.json(
        { error: "No route data returned." },
        { status: 502 }
      );
    }

    // Strip HTML tags from step instructions
    const stripHtml = (html: string): string =>
      html.replace(/<[^>]*>/g, "").trim();

    interface DirectionStep {
      html_instructions?: string;
      distance?: { text?: string };
      duration?: { text?: string };
    }

    const steps = (leg.steps as DirectionStep[]).map((step) => ({
      instruction: stripHtml(step.html_instructions ?? ""),
      distance: step.distance?.text ?? "",
      duration: step.duration?.text ?? "",
    }));

    return NextResponse.json({
      distance: leg.distance?.text ?? "",
      duration: leg.duration?.text ?? "",
      startAddress: leg.start_address ?? origin,
      endAddress: leg.end_address ?? destination,
      steps,
      polyline: route.overview_polyline?.points ?? "",
    });
  } catch (error) {
    console.error("[Directions] Unexpected error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
