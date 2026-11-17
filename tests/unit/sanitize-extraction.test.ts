import { describe, expect, it } from "vitest";
import { sanitizeExtractedSignalsPayload } from "@/modules/intelligence/sanitize-extraction";
import { extractedSignalsResponseSchema } from "@/schemas/signal";

describe("sanitizeExtractedSignalsPayload", () => {
  it("coerces common free-model quirks into Zod-valid signals", () => {
    const sanitized = sanitizeExtractedSignalsPayload({
      signals: [
        {
          source_id: "note_1",
          sku: "SKU001",
          product_name: "Premium Shampoo",
          retailer: "Retailer A",
          region: "North",
          category: "COMPETITOR_ACTIVITY",
          description: "Competitor discount",
          direction: "DECREASE",
          confidence: "0.8",
          potential_impact: 1.5,
          start_date: "2026-01-05",
          end_date: "",
          evidence: "20% discount",
        },
      ],
    });

    const parsed = extractedSignalsResponseSchema.safeParse(sanitized);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.signals[0]?.sourceId).toBe("note_1");
    expect(parsed.data.signals[0]?.confidence).toBe(0.8);
    expect(parsed.data.signals[0]?.potentialImpact).toBe(1);
    expect(parsed.data.signals[0]?.endDate).toBeNull();
    expect(parsed.data.signals[0]?.explanation.length).toBeGreaterThan(0);
  });
});
