import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseNotesCsv, parseSalesCsv } from "@/modules/ingestion/csv";

const salesPath = resolve(process.cwd(), "public/demo/sales.csv");
const notesPath = resolve(process.cwd(), "public/demo/business-notes.csv");

describe("expanded demo datasets", () => {
  it("parses sales demo with multi-region catalog coverage", () => {
    const parsed = parseSalesCsv(readFileSync(salesPath, "utf8"));
    expect(parsed.issues).toHaveLength(0);
    expect(parsed.data.length).toBeGreaterThanOrEqual(40);

    const skus = new Set(parsed.data.map((r) => r.sku));
    const retailers = new Set(parsed.data.map((r) => r.retailer));
    const regions = new Set(parsed.data.map((r) => r.region));

    expect(skus.has("SKU001")).toBe(true);
    expect(skus.has("SKU005")).toBe(true);
    expect(retailers.has("Retailer D")).toBe(true);
    expect(regions.has("East")).toBe(true);
  });

  it("parses notes demo covering diverse business event language", () => {
    const parsed = parseNotesCsv(readFileSync(notesPath, "utf8"));
    expect(parsed.issues).toHaveLength(0);
    expect(parsed.data.length).toBeGreaterThanOrEqual(20);

    const blob = parsed.data.map((n) => n.note.toLowerCase()).join(" ");
    expect(blob).toContain("competitor");
    expect(blob).toContain("promotion");
    expect(blob).toContain("festival");
    expect(blob).toContain("distribution");
    expect(blob).toContain("unclear");
    expect(blob).toContain("preference");
  });
});
