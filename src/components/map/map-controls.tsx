"use client";

import { useState, useCallback } from "react";
import {
  LocateFixed,
  Plus,
  Minus,
  Layers,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useLocation } from "@/hooks/use-location";

// ── Props ───────────────────────────────────────────────────────────────────

interface MapControlsProps {
  /** Current zoom level. */
  zoom?: number;
  /** Called when zoom should change. */
  onZoomChange?: (zoom: number) => void;
  /** Called when the map should centre on a location. */
  onCenterChange?: (center: { lat: number; lng: number }) => void;
  /** Called when the map type should change. */
  onMapTypeChange?: (type: string) => void;
  /** Current map type. */
  mapType?: string;
  /** Additional class names. */
  className?: string;
}

/**
 * Custom map control buttons positioned in the bottom-right corner.
 *
 * Provides:
 * - Locate me (uses geolocation to centre map on user)
 * - Zoom in / zoom out
 * - Layer toggle (roadmap / satellite)
 */
export function MapControls({
  zoom = 5,
  onZoomChange,
  onCenterChange,
  onMapTypeChange,
  mapType = "roadmap",
  className,
}: MapControlsProps) {
  const { requestLocation, isLoading: isLocating, coordinates } = useLocation();
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  // ── Locate me ─────────────────────────────────────────────────────────

  const handleLocateMe = useCallback(async () => {
    setIsRequestingLocation(true);

    try {
      await requestLocation();

      // After location is granted, the hook updates the store.
      // We read fresh coordinates after a brief wait for the store update.
      const freshCoords = coordinates;
      if (freshCoords) {
        onCenterChange?.({ lat: freshCoords.lat, lng: freshCoords.lng });
        onZoomChange?.(14);
      }
    } catch (error) {
      console.error("[MapControls] Location request failed:", error);
    } finally {
      // Use a timeout to re-check coordinates after the async flow completes
      setTimeout(() => {
        setIsRequestingLocation(false);
      }, 500);
    }
  }, [requestLocation, coordinates, onCenterChange, onZoomChange]);

  // ── Zoom ──────────────────────────────────────────────────────────────

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom + 1, 21);
    onZoomChange?.(newZoom);
  }, [zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom - 1, 1);
    onZoomChange?.(newZoom);
  }, [zoom, onZoomChange]);

  // ── Layer toggle ──────────────────────────────────────────────────────

  const handleToggleLayer = useCallback(() => {
    const nextType = mapType === "roadmap" ? "satellite" : "roadmap";
    onMapTypeChange?.(nextType);
  }, [mapType, onMapTypeChange]);

  const showLocating = isRequestingLocation || isLocating;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "absolute bottom-24 right-4 z-10 flex flex-col gap-2 md:bottom-6",
          className
        )}
      >
        {/* Locate me */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleLocateMe}
              disabled={showLocating}
              className="h-10 w-10 rounded-xl border-border bg-white shadow-lg hover:bg-muted/30"
              aria-label="Centre map on my location"
            >
              {showLocating ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#FF9933]" />
              ) : (
                <LocateFixed className="h-5 w-5 text-[#FF9933]" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">My location</TooltipContent>
        </Tooltip>

        {/* Zoom in */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 21}
              className="h-10 w-10 rounded-xl border-border bg-white shadow-lg hover:bg-muted/30"
              aria-label="Zoom in"
            >
              <Plus className="h-5 w-5 text-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom in</TooltipContent>
        </Tooltip>

        {/* Zoom out */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="h-10 w-10 rounded-xl border-border bg-white shadow-lg hover:bg-muted/30"
              aria-label="Zoom out"
            >
              <Minus className="h-5 w-5 text-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom out</TooltipContent>
        </Tooltip>

        {/* Layer toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleToggleLayer}
              className={cn(
                "h-10 w-10 rounded-xl border-border bg-white shadow-lg hover:bg-muted/30",
                mapType === "satellite" && "ring-2 ring-[#FF9933]"
              )}
              aria-label="Toggle map layer"
            >
              <Layers className="h-5 w-5 text-[#000080]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {mapType === "roadmap" ? "Satellite view" : "Map view"}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
