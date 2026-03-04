"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { MediaUploadDialog } from "./media-upload-dialog";

// ── Props ───────────────────────────────────────────────────────────────────

interface MediaUploadButtonProps {
  /** Called when the user confirms file(s) in the upload dialog. */
  onFilesSelected: (files: File[]) => void;
  /** Disables the button (e.g. while a message is sending). */
  disabled?: boolean;
  /** Extra class names for the trigger button. */
  className?: string;
}

/**
 * Paperclip button that opens the MediaUploadDialog when clicked.
 * Designed to sit alongside the chat input.
 */
export function MediaUploadButton({
  onFilesSelected,
  disabled = false,
  className,
}: MediaUploadButtonProps) {
  const [open, setOpen] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    onFilesSelected(files);
    setOpen(false);
  };

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
              onClick={() => setOpen(true)}
              className={className}
              aria-label="Attach file"
            >
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Attach file</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <MediaUploadDialog
        open={open}
        onOpenChange={setOpen}
        onFilesSelected={handleFilesSelected}
      />
    </>
  );
}
