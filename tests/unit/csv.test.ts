import { describe, expect, it } from "vitest";
import {
  parseNotesCsv,
  parsePastedNotes,
  parseSalesCsv,
} from "@/modules/ingestion/csv";

const salesCsv = `date,sku,product_name,retailer,region,units_sold,revenue
2026-01-01,SKU001,Premium Shampoo,Retailer A,North,120,2400
2026-01-02,SKU001,Premium Shampoo,Retailer A,North,bad,2700`;

describe("CSV ingestion", () => {
  it("parses valid sales rows and reports malformed rows", () => {
    const result = parseSalesCsv(salesCsv);
    expect(result.data).toHaveLength(1);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.data[0]?.sku).toBe("SKU001");
  });

  it("requires sales columns", () => {
    const result = parseSalesCsv("date,sku\n2026-01-01,SKU001");
    expect(result.data).toHaveLength(0);
    expect(result.issues[0]?.message).toMatch(/Missing required columns/);
  });

  it("parses notes csv", () => {
    const result = parseNotesCsv(
      `date,retailer,region,note\n2026-01-05,Retailer A,North,"Promo live"`,
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.note).toContain("Promo");
  });

  it("parses pasted free text notes", () => {
    const notes = parsePastedNotes("Line one\n\nLine two");
    expect(notes).toHaveLength(2);
    expect(notes[0]?.id).toBe("paste_1");
  });
});
