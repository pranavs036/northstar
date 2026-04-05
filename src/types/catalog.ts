import { z } from "zod";

export const CsvRowSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  product_name: z.string().min(1, "Product name is required"),
  category: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
});

export type CsvRow = z.infer<typeof CsvRowSchema>;

export const CatalogUploadSchema = z.object({
  brandId: z.string().min(1, "Brand ID is required"),
  rows: z.array(CsvRowSchema).min(1, "At least one product is required"),
});

export type CatalogUpload = z.infer<typeof CatalogUploadSchema>;

export interface Actionable {
  id: string;
  title: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  category: "schema" | "content" | "structured_data" | "reviews" | "comparison";
}

export interface SkuWithStatus {
  id: string;
  skuCode: string;
  name: string;
  category: string | null;
  url: string | null;
  description: string | null;
  scanCount: number;
  visibilityRate: number | null;
  worstSeverity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | null;
  actionablesCount: number;
}
