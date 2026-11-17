const CATEGORIES = new Set([
  "DEMAND_INCREASE",
  "DEMAND_DECREASE",
  "PROMOTION",
  "COMPETITOR_ACTIVITY",
  "SEASONALITY",
  "CUSTOMER_PREFERENCE",
  "SUPPLY_DISRUPTION",
  "UNKNOWN",
]);

const DIRECTIONS = new Set([
  "INCREASE",
  "DECREASE",
  "NEUTRAL",
  "UNKNOWN",
]);

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function asUnitInterval(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function normalizeToken(value: unknown): string {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function inferCategoryFromText(text: string): string | null {
  const t = text.toLowerCase();
  if (/competitor|private[-\s]?label|discount on/.test(t)) return "COMPETITOR_ACTIVITY";
  if (/\bbogo\b|promotion|promo|endcap/.test(t)) return "PROMOTION";
  if (/festival|heatwave|season|monsoon|weather/.test(t)) return "SEASONALITY";
  if (/preference|asking for|fragrance|switching from|natural-ingredient/.test(t)) {
    return "CUSTOMER_PREFERENCE";
  }
  if (/stock|distribution|delay|flood|warehouse|replenish|shipment|stockout/.test(t)) {
    return "SUPPLY_DISRUPTION";
  }
  if (/overpriced|cooling|complaint|decrease|pulling traffic away/.test(t)) {
    return "DEMAND_DECREASE";
  }
  if (/uplift|increase|sampling|rising|footfall|demand to keep rising/.test(t)) {
    return "DEMAND_INCREASE";
  }
  return null;
}

function normalizeCategory(value: unknown, evidenceText = ""): string {
  const inferred = inferCategoryFromText(evidenceText);
  const token = normalizeToken(value);
  if (CATEGORIES.has(token) && token !== "UNKNOWN" && token !== "DEMAND_INCREASE") {
    return token;
  }
  // Small models often over-assign DEMAND_INCREASE/UNKNOWN — prefer evidence keywords.
  if (inferred) return inferred;
  if (CATEGORIES.has(token)) return token;
  if (token.includes("COMPETITOR")) return "COMPETITOR_ACTIVITY";
  if (token.includes("PROMOT")) return "PROMOTION";
  if (token.includes("SEASON") || token.includes("FESTIVAL") || token.includes("WEATHER")) {
    return "SEASONALITY";
  }
  if (token.includes("PREFERENCE") || token.includes("CUSTOMER")) {
    return "CUSTOMER_PREFERENCE";
  }
  if (token.includes("SUPPLY") || token.includes("STOCK") || token.includes("DISTRIB")) {
    return "SUPPLY_DISRUPTION";
  }
  if (token.includes("INCREASE") || token.includes("DEMAND_UP")) return "DEMAND_INCREASE";
  if (token.includes("DECREASE") || token.includes("DEMAND_DOWN")) return "DEMAND_DECREASE";
  return "UNKNOWN";
}

function normalizeDirection(value: unknown): string {
  const token = normalizeToken(value);
  if (DIRECTIONS.has(token)) return token;
  if (token.includes("INCREASE") || token.includes("UP")) return "INCREASE";
  if (token.includes("DECREASE") || token.includes("DOWN")) return "DECREASE";
  if (token.includes("NEUTRAL")) return "NEUTRAL";
  return "UNKNOWN";
}

/**
 * Coerce common free-model JSON quirks before Zod validation.
 * Still does not invent business entities — only normalizes types/enums.
 */
export function sanitizeExtractedSignalsPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return { signals: [] };
  const root = raw as Record<string, unknown>;
  const list = Array.isArray(root.signals) ? root.signals : [];

  const signals = list
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => {
      const description = String(item.description || item.evidence || "Extracted event");
      const evidence = String(item.evidence || item.description || "No evidence provided");
      return {
        sourceId: String(item.sourceId || item.source_id || "unknown"),
        sku: asNullableString(item.sku),
        productName: asNullableString(
          item.productName ?? item.product_name,
        ),
        retailer: asNullableString(item.retailer),
        region: asNullableString(item.region),
        category: normalizeCategory(item.category, `${description} ${evidence}`),
        description,
        direction: normalizeDirection(item.direction),
        confidence: asUnitInterval(item.confidence, 0.5),
        potentialImpact: asUnitInterval(item.potentialImpact ?? item.potential_impact, 0.5),
        startDate: asNullableString(item.startDate ?? item.start_date),
        endDate: asNullableString(item.endDate ?? item.end_date),
        evidence,
        explanation: String(
          item.explanation || item.description || "No explanation provided",
        ),
      };
    });

  return { signals };
}
