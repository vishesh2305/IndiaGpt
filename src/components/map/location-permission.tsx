"use client";

import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "@/hooks/use-location";

// ── Props ───────────────────────────────────────────────────────────────────

interface LocationPermissionProps {
  /** Called when the user dismisses the prompt. */
  onDismiss?: () => void;
  /** Additional class names for the overlay container. */
  className?: string;
}

/**
 * Location permission request overlay.
 *
 * Displayed when the browser location permission is in the "prompt"
 * state and the user has not yet granted or denied access.
 *
 * Shows a friendly card explaining why location is useful, with an
 * "Enable Location" button (saffron) and a "Not now" ghost button.
 */
export function LocationPermission({
  onDismiss,
  className,
}: LocationPermissionProps) {
  const { permissionStatus, requestLocation, isLoading } = useLocation();

  // Only show when permission is promptable
  if (permissionStatus !== "prompt") return null;

  const handleEnable = async () => {
    await requestLocation();
    // After requesting, the permission status will update.
    // If granted, this component won't render; if denied, it also won't show.
  };

  const handleDismiss = () => {
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[2px]",
        className
      )}
    >
      <Card className="mx-4 max-w-sm border-border bg-white p-6 shadow-2xl">
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FF9933]/20 to-[#138808]/20">
              <MapPin className="h-8 w-8 text-[#FF9933]" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#138808] shadow-sm">
              <Navigation className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
        </div>

        {/* Copy */}
        <div className="mb-6 text-center">
          <h3 className="text-lg font-semibold text-[#000080]">
            Enable location for a better experience
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            IndiaGPT can provide location-aware responses when you share your
            location. We&apos;ll be able to show nearby places, provide
            accurate directions, and personalise recommendations for your area.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleEnable}
            disabled={isLoading}
            className="w-full bg-[#FF9933] text-white hover:bg-[#FF9933]/90"
          >
            {isLoading ? (
              <>
                <Navigation className="mr-2 h-4 w-4 animate-pulse" />
                Requesting access...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Enable Location
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleDismiss}
            disabled={isLoading}
            className="w-full text-muted-foreground"
          >
            Not now
          </Button>
        </div>

        {/* Privacy note */}
        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          Your location is only used to improve your experience and is never
          shared with third parties.
        </p>
      </Card>
    </div>
  );
}
