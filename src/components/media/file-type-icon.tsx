"use client";

import {
  Image as ImageIcon,
  FileText,
  File,
  Paperclip,
  type LucideProps,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFileType, getFileTypeFromExtension, type FileCategory } from "@/lib/upload";

// ── Colour mapping ──────────────────────────────────────────────────────────

const categoryColors: Record<FileCategory, string> = {
  image: "text-[#FF9933]",   // saffron
  pdf: "text-red-600",
  document: "text-[#000080]", // navy
};

// ── Icon mapping ────────────────────────────────────────────────────────────

const categoryIcons: Record<FileCategory, React.ComponentType<LucideProps>> = {
  image: ImageIcon,
  pdf: FileText,
  document: File,
};

// ── Props ───────────────────────────────────────────────────────────────────

interface FileTypeIconProps {
  /** MIME type of the file (e.g. "image/png"). Takes precedence over `filename`. */
  mimeType?: string;
  /** File name used as a fallback when `mimeType` is not supplied. */
  filename?: string;
  /** Icon size in pixels. Defaults to 20. */
  size?: number;
  /** Additional class names applied to the icon element. */
  className?: string;
}

/**
 * Renders a coloured Lucide icon appropriate for the given file type.
 *
 * - Images  -> ImageIcon  (saffron #FF9933)
 * - PDFs    -> FileText   (red)
 * - Docs    -> File       (navy #000080)
 * - Default -> Paperclip
 */
export function FileTypeIcon({
  mimeType,
  filename,
  size = 20,
  className,
}: FileTypeIconProps) {
  let category: FileCategory | null = null;

  if (mimeType) {
    category = getFileType(mimeType);
  } else if (filename) {
    category = getFileTypeFromExtension(filename);
  }

  if (!category) {
    return (
      <Paperclip
        size={size}
        className={cn("text-muted-foreground", className)}
      />
    );
  }

  const Icon = categoryIcons[category];
  const colorClass = categoryColors[category];

  return <Icon size={size} className={cn(colorClass, className)} />;
}
