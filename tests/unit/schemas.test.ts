import { describe, expect, it } from "vitest";
import {
  analyzeRequestSchema,
  extractedSignalsResponseSchema,
} from "@/schemas/signal";

describe("schemas", () => {
  it("validates analyze requests", () => {
    const parsed = analyzeRequestSchema.safeParse({
      sales: [
        {
          date: "2026-01-01",
          sku: "SKU001",
          product_name: "Premium Shampoo",
          retailer: "Retailer A",
          region: "North",
          units_sold: 10,
          revenue: 100,
        },
      ],
      notes: [
        {
          id: "n1",
          date: "2026-01-05",
          retailer: "Retailer A",
          region: "North",
          note: "Festival demand rising",
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it("validates AI extraction payloads", () => {
    const parsed = extractedSignalsResponseSchema.safeParse({
      signals: [
        {
          sourceId: "n1",
          sku: null,
          productName: null,
          retailer: "Retailer A",
          region: "North",
          category: "SEASONALITY",
          description: "Festival uplift",
          direction: "INCREASE",
          confidence: 0.7,
          potentialImpact: 0.6,
          startDate: null,
          endDate: null,
          evidence: "festival is expected to increase demand",
          explanation: "Seasonal event",
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });
});
