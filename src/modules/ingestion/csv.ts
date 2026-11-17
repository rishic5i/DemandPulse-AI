import Papa from "papaparse";
import { salesRowSchema, businessNoteSchema } from "@/schemas/signal";
import type { BusinessNote, SalesRow } from "@/types/domain";

export interface ParseIssue {
  row: number;
  message: string;
}

export interface ParseResult<T> {
  data: T[];
  issues: ParseIssue[];
}

const MAX_FILE_CHARS = 1_500_000;

function ensureSize(text: string) {
  if (text.length > MAX_FILE_CHARS) {
    throw new Error(
      `File too large. Keep uploads under ~${Math.floor(MAX_FILE_CHARS / 1000)}KB of text.`,
    );
  }
}

export function parseSalesCsv(text: string): ParseResult<SalesRow> {
  ensureSize(text);
  const parsed = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    return {
      data: [],
      issues: parsed.errors.map((e) => ({
        row: (e.row ?? 0) + 1,
        message: e.message,
      })),
    };
  }

  const required = [
    "date",
    "sku",
    "product_name",
    "retailer",
    "region",
    "units_sold",
    "revenue",
  ];
  const fields = parsed.meta.fields ?? [];
  const missing = required.filter((col) => !fields.includes(col));
  if (missing.length > 0) {
    return {
      data: [],
      issues: [
        {
          row: 0,
          message: `Missing required columns: ${missing.join(", ")}`,
        },
      ],
    };
  }

  const data: SalesRow[] = [];
  const issues: ParseIssue[] = [];

  parsed.data.forEach((row, index) => {
    const result = salesRowSchema.safeParse(row);
    if (!result.success) {
      issues.push({
        row: index + 2,
        message: result.error.issues.map((i) => i.message).join("; "),
      });
      return;
    }
    data.push(result.data);
  });

  return { data, issues };
}

export function parseNotesCsv(text: string): ParseResult<BusinessNote> {
  ensureSize(text);
  const parsed = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    return {
      data: [],
      issues: parsed.errors.map((e) => ({
        row: (e.row ?? 0) + 1,
        message: e.message,
      })),
    };
  }

  const fields = parsed.meta.fields ?? [];
  if (!fields.includes("date") || !fields.includes("note")) {
    return {
      data: [],
      issues: [
        {
          row: 0,
          message: "Notes CSV requires at least date and note columns",
        },
      ],
    };
  }

  const data: BusinessNote[] = [];
  const issues: ParseIssue[] = [];

  parsed.data.forEach((row, index) => {
    const candidate = {
      id: row.id?.trim() || `note_${index + 1}`,
      date: row.date,
      retailer: row.retailer?.trim() ? row.retailer.trim() : null,
      region: row.region?.trim() ? row.region.trim() : null,
      note: row.note,
    };
    const result = businessNoteSchema.safeParse(candidate);
    if (!result.success) {
      issues.push({
        row: index + 2,
        message: result.error.issues.map((i) => i.message).join("; "),
      });
      return;
    }
    data.push(result.data);
  });

  return { data, issues };
}

export function parsePastedNotes(text: string): BusinessNote[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // If it looks like CSV with headers, reuse CSV parser.
  if (trimmed.toLowerCase().includes("date,") && trimmed.includes("note")) {
    return parseNotesCsv(trimmed).data;
  }

  return trimmed
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((note, index) => ({
      id: `paste_${index + 1}`,
      date: new Date().toISOString().slice(0, 10),
      retailer: null,
      region: null,
      note,
    }));
}
