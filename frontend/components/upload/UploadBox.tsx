"use client";

/**
 * UploadBox — file picker and upload progress indicator.
 *
 * Day 2 scope (prd.md section 2 /upload Day 2):
 *   - File picker: drag-drop zone OR click-to-browse
 *   - Accepts .csv and .json only (matching data-format.md sections 1–2)
 *   - Shows simulated progress bar during the mock network call
 *   - Calls onUploadComplete(response) with the UploadResponse on success
 *   - Calls onUploadError(message) on failure
 *
 * Day 4+ features NOT included here:
 *   - ValidationPanel (full errors/warnings panel) — Day 4
 *   - SummaryCards with icons — Day 4
 *   - Duplicate team visual flagging beyond counts — Day 4
 *
 * Accessibility:
 *   - Drop zone is a <button> (native interactive element, not a div)
 *   - aria-label on the hidden file input
 *   - Progress bar uses role="progressbar" + aria-valuenow
 */

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadDataset } from "@/lib/api";
import type { UploadResponse } from "@/lib/types";

interface UploadBoxProps {
  onUploadComplete: (response: UploadResponse) => void;
  onUploadError: (message: string) => void;
}

type UploadState = "idle" | "uploading" | "done" | "error";

const ACCEPTED_MIME_TYPES = ["text/csv", "application/json", "application/vnd.ms-excel"];
const ACCEPTED_EXTENSIONS = [".csv", ".json"];

/** Returns true if the file extension or MIME type is CSV or JSON. */
function isAcceptedFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return (
    ACCEPTED_EXTENSIONS.includes(`.${ext}`) ||
    ACCEPTED_MIME_TYPES.includes(file.type)
  );
}

export function UploadBox({ onUploadComplete, onUploadError }: UploadBoxProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulated progress: ticks up to 90% during the mock delay, then jumps to 100%.
  function startProgressSimulation(): () => void {
    let current = 0;
    const interval = setInterval(() => {
      // Asymptotically approach 90% — never reaches 100 until upload resolves.
      current = Math.min(current + Math.random() * 12, 90);
      setProgress(Math.round(current));
    }, 120);
    return () => clearInterval(interval);
  }

  const handleFile = useCallback(
    async (file: File) => {
      setValidationError(null);

      if (!isAcceptedFile(file)) {
        setValidationError(
          `Only .csv and .json files are accepted. "${file.name}" is not supported.`
        );
        return;
      }

      setSelectedFileName(file.name);
      setUploadState("uploading");
      setProgress(0);

      const stopProgress = startProgressSimulation();

      try {
        const response = await uploadDataset(file);
        stopProgress();
        setProgress(100);
        setUploadState("done");
        onUploadComplete(response);
      } catch (err: unknown) {
        stopProgress();
        setUploadState("error");
        const message =
          err instanceof Error ? err.message : "Upload failed. Please try again.";
        onUploadError(message);
      }
    },
    [onUploadComplete, onUploadError]
  );

  // Drop zone drag events
  function handleDragOver(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  // Click-to-browse
  function handleDropZoneClick() {
    fileInputRef.current?.click();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    // Reset input so the same file can be re-selected after an error
    e.target.value = "";
  }

  // Reset to allow re-upload
  function handleReset() {
    setUploadState("idle");
    setProgress(0);
    setSelectedFileName(null);
    setValidationError(null);
  }

  const isUploading = uploadState === "uploading";

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden file input — triggered by the drop zone button */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json"
        aria-label="Choose a CSV or JSON registration file"
        className="sr-only"
        onChange={handleInputChange}
        disabled={isUploading}
      />

      {/* Drop zone — native <button> for keyboard and click access */}
      <button
        type="button"
        aria-label="Drop a CSV or JSON file here, or click to browse"
        disabled={isUploading || uploadState === "done"}
        onClick={handleDropZoneClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "flex flex-col items-center justify-center gap-2",
          "w-full min-h-36 rounded-lg border-2 border-dashed",
          "text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dragOver
            ? "border-primary bg-primary/5 text-primary"
            : uploadState === "done"
            ? "border-green-300 bg-green-50 text-green-700 cursor-default"
            : "border-muted-foreground/30 bg-muted/30 text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary",
          isUploading ? "cursor-wait opacity-70" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {uploadState === "idle" && (
          <>
            <svg
              aria-hidden="true"
              className="h-8 w-8 opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
              />
            </svg>
            <span className="font-medium">Drop your file here, or click to browse</span>
            <span className="text-xs opacity-70">Accepts .csv and .json — up to 10 MB</span>
          </>
        )}

        {uploadState === "uploading" && (
          <>
            <svg
              aria-hidden="true"
              className="h-6 w-6 animate-spin opacity-60"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span className="font-medium">
              Uploading{" "}
              <span
                className="max-w-xs truncate inline-block align-bottom"
                title={selectedFileName ?? ""}
              >
                {selectedFileName}
              </span>
              …
            </span>
          </>
        )}

        {uploadState === "done" && (
          <>
            <svg
              aria-hidden="true"
              className="h-7 w-7 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium text-green-700">
              <span
                className="max-w-xs truncate inline-block align-bottom"
                title={selectedFileName ?? ""}
              >
                {selectedFileName}
              </span>{" "}
              uploaded
            </span>
          </>
        )}

        {uploadState === "error" && (
          <>
            <svg
              aria-hidden="true"
              className="h-7 w-7 text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="font-medium text-red-600">Upload failed</span>
          </>
        )}
      </button>

      {/* Progress bar */}
      {(isUploading || uploadState === "done") && (
        <div className="flex flex-col gap-1">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Upload progress: ${progress}%`}
            className="h-2 w-full rounded-full bg-muted overflow-hidden"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground text-right">{progress}%</span>
        </div>
      )}

      {/* Client-side validation error (wrong file type) */}
      {validationError && (
        <p role="alert" className="text-sm text-red-600">
          {validationError}
        </p>
      )}

      {/* Re-upload button after done or error */}
      {(uploadState === "done" || uploadState === "error") && (
        <Button variant="outline" size="sm" onClick={handleReset} className="self-start">
          Upload a different file
        </Button>
      )}
    </div>
  );
}
