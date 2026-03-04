"use client";

import { useState, useCallback } from "react";
import { validateFile as validateFileUtil } from "@/lib/upload";

// ── Types ───────────────────────────────────────────────────────────────────

export interface UploadedFile {
  /** The publicly accessible URL of the uploaded file. */
  url: string;
  /** MIME type of the file. */
  type: string;
  /** Original file name. */
  name: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

interface UseMediaUploadReturn {
  /**
   * Upload a single file to the server.
   *
   * @param file - The File to upload
   * @returns The uploaded file metadata (url, type, name)
   */
  uploadFile: (file: File) => Promise<UploadedFile>;

  /**
   * Upload multiple files in parallel.
   *
   * @param files - Array of Files to upload
   * @returns Array of uploaded file metadata
   */
  uploadFiles: (files: File[]) => Promise<UploadedFile[]>;

  /** Validate a file against supported types and size limits. */
  validateFile: (file: File) => ValidationResult;

  /** Upload progress percentage (0-100) for the current upload batch. */
  uploadProgress: number;

  /** Whether an upload is currently in progress. */
  isUploading: boolean;

  /** The most recent upload error message, if any. */
  error: string | null;

  /** Clear the current error state. */
  clearError: () => void;
}

/**
 * Custom hook for uploading files to the IndiaGPT backend.
 *
 * Handles validation, progress tracking, and error state.
 *
 * @example
 * ```tsx
 * const { uploadFile, isUploading, error } = useMediaUpload();
 *
 * const handleAttach = async (file: File) => {
 *   const result = await uploadFile(file);
 *   console.log(result.url);
 * };
 * ```
 */
export function useMediaUpload(): UseMediaUploadReturn {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Validate ────────────────────────────────────────────────────────────

  const validateFile = useCallback((file: File): ValidationResult => {
    return validateFileUtil(file);
  }, []);

  // ── Upload single file ──────────────────────────────────────────────────

  const uploadFile = useCallback(
    async (file: File): Promise<UploadedFile> => {
      // Pre-validate
      const validation = validateFileUtil(file);
      if (!validation.valid) {
        const errMsg = validation.error ?? "Invalid file";
        setError(errMsg);
        throw new Error(errMsg);
      }

      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append("file", file);

        // Use XMLHttpRequest for progress tracking
        const result = await new Promise<UploadedFile>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(percent);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve({
                  url: data.url,
                  type: data.type || file.type,
                  name: data.name || file.name,
                });
              } catch {
                reject(new Error("Failed to parse upload response"));
              }
            } else {
              let message = "Upload failed";
              try {
                const errData = JSON.parse(xhr.responseText);
                message = errData.error || message;
              } catch {
                // Use default message
              }
              reject(new Error(message));
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
          });

          xhr.addEventListener("abort", () => {
            reject(new Error("Upload was cancelled"));
          });

          xhr.open("POST", "/api/upload");
          xhr.send(formData);
        });

        setUploadProgress(100);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  // ── Upload multiple files ───────────────────────────────────────────────

  const uploadFiles = useCallback(
    async (files: File[]): Promise<UploadedFile[]> => {
      if (files.length === 0) return [];

      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      const results: UploadedFile[] = [];
      const total = files.length;

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          // Validate before uploading
          const validation = validateFileUtil(file);
          if (!validation.valid) {
            throw new Error(`${file.name}: ${validation.error}`);
          }

          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(
              errData.error || `Failed to upload ${file.name}`
            );
          }

          const data = await response.json();
          results.push({
            url: data.url,
            type: data.type || file.type,
            name: data.name || file.name,
          });

          // Update progress based on file count
          setUploadProgress(Math.round(((i + 1) / total) * 100));
        }

        return results;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  // ── Clear error ─────────────────────────────────────────────────────────

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    uploadFile,
    uploadFiles,
    validateFile,
    uploadProgress,
    isUploading,
    error,
    clearError,
  };
}
