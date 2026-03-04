"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { FileTypeIcon } from "./file-type-icon";
import { formatFileSize } from "@/lib/upload";

// ── Props ───────────────────────────────────────────────────────────────────

export interface AttachedFile {
  file: File;
  /** Preview URL for images (created via URL.createObjectURL). */
  previewUrl?: string;
}

interface MediaPreviewProps {
  /** The list of files attached by the user, pending send. */
  files: AttachedFile[];
  /** Callback to remove a file by its index. */
  onRemove: (index: number) => void;
  /** Additional class names for the container. */
  className?: string;
}

/**
 * Horizontal scrollable preview row displayed above the chat input
 * showing thumbnails / icons for each attached file before the user
 * sends their message.
 */
export function MediaPreview({ files, onRemove, className }: MediaPreviewProps) {
  if (files.length === 0) return null;

  return (
    <div
      className={cn(
        "border-b border-border bg-muted/20 px-3 py-2",
        className
      )}
    >
      <ScrollArea className="w-full">
        <div className="flex gap-2">
          {files.map((item, index) => (
            <PreviewItem
              key={`${item.file.name}-${index}`}
              item={item}
              onRemove={() => onRemove(index)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

// ── Individual preview item ─────────────────────────────────────────────────

interface PreviewItemProps {
  item: AttachedFile;
  onRemove: () => void;
}

function PreviewItem({ item, onRemove }: PreviewItemProps) {
  const { file, previewUrl } = item;
  const isImage = file.type.startsWith("image/");

  // Create an object URL for images if one was not provided
  const src = useMemo(() => {
    if (isImage && previewUrl) return previewUrl;
    if (isImage) return URL.createObjectURL(file);
    return null;
  }, [file, isImage, previewUrl]);

  return (
    <div className="group relative flex shrink-0 items-center gap-2 rounded-lg border border-border bg-white px-2 py-1.5 shadow-sm">
      {/* Thumbnail or icon */}
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={file.name}
          className="h-16 w-16 rounded object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded bg-muted/40">
          <FileTypeIcon mimeType={file.type} filename={file.name} size={28} />
        </div>
      )}

      {/* File info (non-images, or always for extra context) */}
      {!isImage && (
        <div className="min-w-0 max-w-[120px]">
          <p className="truncate text-xs font-medium">{file.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {formatFileSize(file.size)}
          </p>
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-opacity hover:bg-red-600 md:opacity-0 md:group-hover:opacity-100"
        aria-label={`Remove ${file.name}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
