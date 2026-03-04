"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FileTypeIcon } from "./file-type-icon";
import { getFileType, type FileCategory } from "@/lib/upload";

// ── Props ───────────────────────────────────────────────────────────────────

interface MediaThumbnailProps {
  /** The publicly accessible URL of the uploaded file. */
  url: string;
  /** The file's MIME type (e.g. "image/png"). */
  mimeType: string;
  /** Original file name. */
  name: string;
  /** Additional class names for the outer wrapper. */
  className?: string;
}

/**
 * Compact file thumbnail for use inside chat messages.
 *
 * - **Images**: clickable thumbnail that opens a full-size dialog.
 * - **PDFs**: PDF icon + filename, clickable to open in a new tab.
 * - **Other**: file icon + filename.
 */
export function MediaThumbnail({
  url,
  mimeType,
  name,
  className,
}: MediaThumbnailProps) {
  const category = getFileType(mimeType);

  if (category === "image") {
    return <ImageThumbnail url={url} name={name} className={className} />;
  }

  if (category === "pdf") {
    return (
      <FileThumbnail
        url={url}
        name={name}
        mimeType={mimeType}
        clickable
        className={className}
      />
    );
  }

  return (
    <FileThumbnail
      url={url}
      name={name}
      mimeType={mimeType}
      className={className}
    />
  );
}

// ── Image thumbnail with lightbox ───────────────────────────────────────────

function ImageThumbnail({
  url,
  name,
  className,
}: {
  url: string;
  name: string;
  className?: string;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className={cn(
          "group relative overflow-hidden rounded-lg border border-border transition-shadow hover:shadow-md",
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={name}
          loading="lazy"
          className="h-32 max-w-[200px] object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
          <ExternalLink className="h-5 w-5 text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100" />
        </div>
      </button>

      {/* Full-size lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-h-[90vh] max-w-[90vw] overflow-auto p-2 sm:p-4">
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <DialogDescription className="sr-only">
            Full size preview of {name}
          </DialogDescription>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={name}
            className="max-h-[85vh] w-auto rounded-lg object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Generic file thumbnail (PDF / other) ────────────────────────────────────

function FileThumbnail({
  url,
  name,
  mimeType,
  clickable = false,
  className,
}: {
  url: string;
  name: string;
  mimeType: string;
  clickable?: boolean;
  className?: string;
}) {
  const content = (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 transition-colors",
        clickable && "cursor-pointer hover:bg-muted/50",
        className
      )}
    >
      <FileTypeIcon mimeType={mimeType} filename={name} size={20} />
      <span className="max-w-[160px] truncate text-xs font-medium text-foreground">
        {name}
      </span>
    </div>
  );

  if (clickable) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}
