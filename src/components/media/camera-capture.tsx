"use client";

import { useRef, useCallback } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { validateFile } from "@/lib/upload";

// ── Props ───────────────────────────────────────────────────────────────────

interface CameraCaptureProps {
  /** Called with the captured image file. */
  onCapture: (file: File) => void;
  /** Called when validation fails. */
  onError?: (error: string) => void;
  /** Disables the button. */
  disabled?: boolean;
  /** Additional class names for the button. */
  className?: string;
}

/**
 * Camera capture button for mobile devices.
 *
 * On mobile: opens the device camera via `capture="environment"`.
 * On desktop: falls back to the standard file picker (images only).
 *
 * Only accepts image files.
 */
export function CameraCapture({
  onCapture,
  onError,
  disabled = false,
  className,
}: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const result = validateFile(file);
      if (!result.valid) {
        onError?.(result.error ?? "Invalid file");
        // Reset the input so the same file can be re-selected
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      if (!file.type.startsWith("image/")) {
        onError?.("Only image files can be captured with the camera.");
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      onCapture(file);

      // Reset the input value so onChange fires even for the same file
      if (inputRef.current) inputRef.current.value = "";
    },
    [onCapture, onError]
  );

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              onClick={handleClick}
              className={className}
              aria-label="Take a photo"
            >
              <Camera className="h-5 w-5 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Take a photo</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/*
        Hidden file input. On mobile browsers the `capture` attribute
        opens the device camera. On desktop it simply opens a file
        picker filtered to images.
      */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        capture="environment"
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
    </>
  );
}
