"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { parseCatalogCsv, type ParseResult } from "@/lib/utils/csv-parser";
import { useRouter } from "next/navigation";
import type { CsvRow } from "@/types/catalog";

interface CatalogUploadProps {
  brandId: string;
}

export function CatalogUpload({ brandId }: CatalogUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);

  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadError("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = parseCatalogCsv(content);
        setParseResult(result);
        setUploadError(null);
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Failed to parse CSV"
        );
        setParseResult(null);
      }
    };
    reader.onerror = () => {
      setUploadError("Failed to read file");
      setParseResult(null);
    };
    reader.readAsText(file);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.currentTarget.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!parseResult || parseResult.valid.length === 0) {
      setUploadError("No valid rows to upload");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await fetch("/api/catalog/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          rows: parseResult.valid,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      const data = await response.json();
      setUploadCount(data.created || 0);
      setUploadSuccess(true);

      setTimeout(() => {
        router.push("/audit/new");
      }, 1500);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload catalog"
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (uploadSuccess) {
    return (
      <div className="bg-bg-secondary border border-border rounded-lg p-12 text-center">
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Catalog Uploaded Successfully
        </h3>
        <p className="text-text-tertiary mb-4">
          {uploadCount} products imported. Starting audit...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer",
          isDragActive
            ? "border-accent-primary bg-accent-primary/5"
            : "border-border bg-bg-secondary hover:border-accent-primary hover:bg-accent-primary/2"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <Upload className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Upload CSV Catalog
        </h3>
        <p className="text-text-tertiary mb-4">
          Drag and drop your CSV file here, or click to browse
        </p>
        <p className="text-sm text-text-tertiary">
          Required columns: sku, product_name | Optional: category, url, description
        </p>
      </div>

      {/* Error State */}
      {uploadError && (
        <div className="bg-error/10 border border-error/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-error">Upload Error</p>
            <p className="text-sm text-error/80 mt-1">{uploadError}</p>
          </div>
        </div>
      )}

      {/* Parse Results */}
      {parseResult && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-bg-secondary border border-border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-success">
                {parseResult.valid.length}
              </p>
              <p className="text-sm text-text-tertiary">Valid Rows</p>
            </div>
            {parseResult.errors.length > 0 && (
              <div className="bg-bg-secondary border border-border rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-warning">
                  {parseResult.errors.length}
                </p>
                <p className="text-sm text-text-tertiary">Errors</p>
              </div>
            )}
            <div className="bg-bg-secondary border border-border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-info">
                {parseResult.valid.length + parseResult.errors.length}
              </p>
              <p className="text-sm text-text-tertiary">Total Rows</p>
            </div>
          </div>

          {/* Error Details */}
          {parseResult.errors.length > 0 && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
              <p className="font-medium text-warning mb-3">Validation Errors:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {parseResult.errors.map((error, i) => (
                  <div key={i} className="text-sm text-warning/80">
                    <strong>Row {error.row}:</strong> {error.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parseResult.valid.length > 0 && (
            <div>
              <h3 className="font-semibold text-text-primary mb-3">
                Preview (first 10 rows)
              </h3>
              <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-bg-tertiary/50">
                        <th className="px-4 py-3 text-left font-semibold text-text-tertiary">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-text-tertiary">
                          Product Name
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-text-tertiary">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-text-tertiary">
                          URL
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parseResult.valid.slice(0, 10).map((row, i) => (
                        <tr
                          key={i}
                          className="hover:bg-bg-tertiary/30 transition-colors"
                        >
                          <td className="px-4 py-3 text-text-primary">
                            {row.sku}
                          </td>
                          <td className="px-4 py-3 text-text-primary">
                            {row.product_name}
                          </td>
                          <td className="px-4 py-3 text-text-secondary">
                            {row.category || "—"}
                          </td>
                          <td className="px-4 py-3 text-text-secondary truncate max-w-xs">
                            {row.url || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {parseResult.valid.length > 10 && (
                <p className="text-sm text-text-tertiary mt-2">
                  Showing 10 of {parseResult.valid.length} rows
                </p>
              )}
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={isUploading || parseResult.valid.length === 0}
            className={cn(
              "w-full px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
              isUploading || parseResult.valid.length === 0
                ? "bg-bg-tertiary text-text-tertiary cursor-not-allowed"
                : "bg-accent-primary text-white hover:bg-accent-secondary"
            )}
          >
            {isUploading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload {parseResult.valid.length} SKUs
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
