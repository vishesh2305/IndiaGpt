"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  validateFile,
  SUPPORTED_MIME_TYPES,
  MAX_FILE_SIZE,
  ACCEPT_STRING,
  formatFileSize,
} from "@/lib/upload";
import { FileTypeIcon } from "./file-type-icon";

// ── Props ───────────────────────────────────────────────────────────────────

interface MediaUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilesSelected: (files: File[]) => void;
}

// ── Accepted MIME types for react-dropzone ───────────────────────────────────

const dropzoneAccept: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "text/markdown": [".md"],
};

/**
 * Full-screen upload dialog with a drag-and-drop zone.
 *
 * Features:
 * - Drag & drop zone with visual feedback
 * - Click-to-browse fallback
 * - File validation (type + size)
 * - Preview row for selected files
 * - Remove individual files before confirming
 */
export function MediaUploadDialog({
  open,
  onOpenChange,
  onFilesSelected,
}: MediaUploadDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // ── Drop handler ────────────────────────────────────────────────────────

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: unknown[]) => {
    const newErrors: string[] = [];

    // Validate each accepted file through our own logic too
    const validFiles: File[] = [];
    for (const file of acceptedFiles) {
      const result = validateFile(file);
      if (result.valid) {
        validFiles.push(file);
      } else {
        newErrors.push(`${file.name}: ${result.error}`);
      }
    }

    // Capture rejections from react-dropzone
    if (Array.isArray(rejectedFiles)) {
      for (const rejection of rejectedFiles) {
        const rej = rejection as { file: File; errors: { message: string }[] };
        const msgs = rej.errors?.map((e) => e.message).join(", ") ?? "Invalid file";
        newErrors.push(`${rej.file?.name ?? "Unknown file"}: ${msgs}`);
      }
    }

    setErrors(newErrors);
    setFiles((prev) => [...prev, ...validFiles]);
  }, []);

  // ── Dropzone config ─────────────────────────────────────────────────────

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: dropzoneAccept,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  // ── Remove a file ───────────────────────────────────────────────────────

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Confirm ─────────────────────────────────────────────────────────────

  const handleConfirm = () => {
    if (files.length === 0) return;
    onFilesSelected(files);
    handleClose();
  };

  // ── Close / reset ───────────────────────────────────────────────────────

  const handleClose = () => {
    setFiles([]);
    setErrors([]);
    onOpenChange(false);
  };

  // ── Image preview URL helper ────────────────────────────────────────────

  const getPreviewUrl = (file: File): string | null => {
    if (file.type.startsWith("image/")) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-navy">Upload Files</DialogTitle>
          <DialogDescription>
            Attach images, PDFs, or text files to your message. Max 10 MB per
            file.
          </DialogDescription>
        </DialogHeader>

        {/* ── Dropzone ──────────────────────────────────────────────────── */}
        <div
          {...getRootProps()}
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors",
            isDragActive
              ? "border-[#FF9933] bg-[#FF9933]/5"
              : "border-muted-foreground/25 hover:border-[#FF9933]/50 hover:bg-muted/30"
          )}
        >
          <input {...getInputProps()} />
          <Upload
            className={cn(
              "mb-3 h-10 w-10",
              isDragActive ? "text-[#FF9933]" : "text-muted-foreground"
            )}
          />
          {isDragActive ? (
            <p className="text-sm font-medium text-[#FF9933]">
              Drop files here...
            </p>
          ) : (
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Drag &amp; drop files here, or click to browse
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                JPG, PNG, WebP, GIF, PDF, TXT &middot; Up to 10 MB
              </p>
            </div>
          )}
        </div>

        {/* ── Error messages ────────────────────────────────────────────── */}
        {errors.length > 0 && (
          <div className="space-y-1.5">
            {errors.map((err, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Selected file previews ────────────────────────────────────── */}
        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {files.length} file{files.length > 1 ? "s" : ""} selected
            </p>
            <div className="flex flex-wrap gap-2">
              {files.map((file, index) => {
                const previewUrl = getPreviewUrl(file);
                return (
                  <div
                    key={`${file.name}-${index}`}
                    className="group relative flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
                  >
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt={file.name}
                        className="h-10 w-10 rounded object-cover"
                        onLoad={() => URL.revokeObjectURL(previewUrl)}
                      />
                    ) : (
                      <FileTypeIcon
                        mimeType={file.type}
                        filename={file.name}
                        size={24}
                      />
                    )}
                    <div className="min-w-0 max-w-[140px]">
                      <p className="truncate text-xs font-medium">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={files.length === 0}
            className="bg-[#FF9933] text-white hover:bg-[#FF9933]/90"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload {files.length > 0 ? `(${files.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
