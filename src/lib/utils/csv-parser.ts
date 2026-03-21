import Papa from "papaparse";
import { CsvRowSchema, type CsvRow } from "@/types/catalog";

export interface ParseResult {
  valid: CsvRow[];
  errors: Array<{ row: number; message: string }>;
}

export function parseCatalogCsv(csvText: string): ParseResult {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) =>
      h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  const valid: CsvRow[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  parsed.data.forEach((row: unknown, index: number) => {
    const result = CsvRowSchema.safeParse(row);
    if (result.success) {
      valid.push(result.data);
    } else {
      const messages = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      errors.push({ row: index + 2, message: messages }); // +2 for header + 0-index
    }
  });

  return { valid, errors };
}
