import { describe, expect, it } from "vitest";
import { validateAndNormalizeSignals } from "@/modules/intelligence/normalize";
import type { SalesRow } from "@/types/domain";
import type { ExtractedSignal } from "@/schemas/signal";

const sales: SalesRow[] = [
  {
    date: "2026-01-01",
    sku: "SKU001",
    product_name: "Premium Shampoo",
    retailer: "Retailer A",
    region: "North",
    units_sold: 10,
    revenue: 100,
  },
];

function base(overrides: Partial<ExtractedSignal> = {}): ExtractedSignal {
  return {
    sourceId: "note_1",
    sku: "SKU001",
    productName: "Premium Shampoo",
    retailer: "Retailer A",
    region: "North",
    category: "COMPETITOR_ACTIVITY",
    description: "Competitor discount",
    direction: "DECREASE",
    confidence: 0.8,
    potentialImpact: 0.7,
    startDate: "2026-01-05",
    endDate: null,
    evidence: "competitor launched a 20% discount",
    explanation: "Competitor promo may suppress demand",
    ...overrides,
  };
}

describe("signal normalization", () => {
  it("keeps known entities and marks supply risk", () => {
    const signals = validateAndNormalizeSignals(
      [base({ category: "SUPPLY_DISRUPTION", direction: "DECREASE" })],
      sales,
    );
    expect(signals).toHaveLength(1);
    expect(signals[0]?.isSupplyRisk).toBe(true);
    expect(signals[0]?.validationStatus).toBe("VALID");
  });

  it("does not guess unknown SKUs", () => {
    const signals = validateAndNormalizeSignals(
      [base({ sku: "SKU999", productName: null })],
      sales,
    );
    expect(signals[0]?.sku).toBeNull();
    expect(signals[0]?.validationStatus).toBe("UNRESOLVED_ENTITIES");
  });

  it("deduplicates identical events", () => {
    const signals = validateAndNormalizeSignals([base(), base()], sales);
    expect(signals).toHaveLength(1);
  });
});
