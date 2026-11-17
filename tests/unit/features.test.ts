import { describe, expect, it } from "vitest";
import { generateFeatures } from "@/modules/features/generate";
import type { DemandSignal, SalesRow } from "@/types/domain";

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
  {
    date: "2026-01-01",
    sku: "SKU002",
    product_name: "Herbal Shampoo",
    retailer: "Retailer A",
    region: "North",
    units_sold: 8,
    revenue: 80,
  },
];

function signal(partial: Partial<DemandSignal>): DemandSignal {
  return {
    signalId: partial.signalId || "sig_1",
    sourceId: "note_1",
    sku: "SKU001",
    productName: "Premium Shampoo",
    retailer: "Retailer A",
    region: "North",
    category: "DEMAND_INCREASE",
    description: "Interest rising",
    direction: "INCREASE",
    confidence: 0.9,
    potentialImpact: 0.8,
    startDate: "2026-01-05",
    endDate: null,
    evidence: "customers asking",
    explanation: "preference shift",
    extractedAt: "2026-01-10T00:00:00.000Z",
    validationStatus: "VALID",
    isSupplyRisk: false,
    ...partial,
  };
}

describe("feature generation", () => {
  it("is deterministic", () => {
    const signals = [
      signal({ signalId: "a", direction: "INCREASE" }),
      signal({
        signalId: "b",
        category: "SUPPLY_DISRUPTION",
        isSupplyRisk: true,
        direction: "DECREASE",
        confidence: 0.7,
        potentialImpact: 0.6,
      }),
    ];
    const asOf = new Date("2026-01-12T00:00:00.000Z");
    const first = generateFeatures(signals, sales, asOf);
    const second = generateFeatures(signals, sales, asOf);
    expect(first).toEqual(second);
  });

  it("distinguishes missing from zero and separates demand/supply", () => {
    const asOf = new Date("2026-01-12T00:00:00.000Z");
    const features = generateFeatures(
      [signal({ signalId: "only-demand" })],
      sales,
      asOf,
    );

    const sku1 = features.find((f) => f.sku === "SKU001");
    const sku2 = features.find((f) => f.sku === "SKU002");

    expect(sku1?.demand_up_count).toBe(1);
    expect(sku1?.promotion_active).toBe(0);
    expect(sku1?.supply_disruption_score).toBeNull();
    expect(sku1?.stockout_risk_indicator).toBeNull();

    expect(sku2?.demand_signal_count).toBeNull();
    expect(sku2?.net_demand_signal).toBeNull();
  });

  it("avoids future leakage", () => {
    const asOf = new Date("2026-01-01T00:00:00.000Z");
    const features = generateFeatures(
      [signal({ startDate: "2026-02-01" })],
      sales,
      asOf,
    );
    const sku1 = features.find((f) => f.sku === "SKU001");
    expect(sku1?.demand_signal_count).toBeNull();
  });
});
