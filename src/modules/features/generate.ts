import { round4 } from "@/lib/utils";
import type { DemandSignal, FeatureRecord, SalesRow } from "@/types/domain";

function keyOf(sku: string, retailer: string, region: string): string {
  return `${sku}||${retailer}||${region}`;
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return round4(values.reduce((a, b) => a + b, 0) / values.length);
}

function scoreByCategory(
  signals: DemandSignal[],
  category: DemandSignal["category"],
): number | null {
  const matched = signals.filter((s) => s.category === category);
  if (matched.length === 0) return null;
  return round4(
    matched.reduce((sum, s) => sum + s.potentialImpact * s.confidence, 0) /
      matched.length,
  );
}

/**
 * Deterministic feature engineering.
 * LLM extracts events; this module alone computes numerical features.
 *
 * Formulas (transparent):
 * - demand_up_count / demand_down_count: count of non-supply signals with direction
 * - net_demand_signal: (up - down) / max(total demand signals, 1) in [-1, 1]
 * - promotion_active: 1 if any PROMOTION signal else 0 (null if no signals at all for key)
 * - *_score features: mean(potentialImpact * confidence) for matching category
 * - stockout_risk_indicator: 1 if supply_disruption_score >= 0.5 else 0 (null if no supply signals)
 * - signal_confidence: mean confidence across contributing signals
 * - feature_freshness_hours: hours since newest contributing signal
 */
export function generateFeatures(
  signals: DemandSignal[],
  sales: SalesRow[],
  asOf = new Date(),
): FeatureRecord[] {
  const keys = new Map<string, { sku: string; retailer: string; region: string }>();

  for (const row of sales) {
    keys.set(keyOf(row.sku, row.retailer, row.region), {
      sku: row.sku,
      retailer: row.retailer,
      region: row.region,
    });
  }

  for (const signal of signals) {
    if (signal.sku && signal.retailer && signal.region) {
      keys.set(keyOf(signal.sku, signal.retailer, signal.region), {
        sku: signal.sku,
        retailer: signal.retailer,
        region: signal.region,
      });
    }
  }

  const asOfIso = asOf.toISOString();
  const features: FeatureRecord[] = [];

  for (const { sku, retailer, region } of keys.values()) {
    const related = signals.filter((signal) => {
      const skuOk = !signal.sku || signal.sku === sku;
      const retailerOk = !signal.retailer || signal.retailer === retailer;
      const regionOk = !signal.region || signal.region === region;
      return skuOk && retailerOk && regionOk;
    });

    // Avoid future leakage: ignore signals that start after asOf.
    const usable = related.filter((signal) => {
      if (!signal.startDate) return true;
      return new Date(signal.startDate).getTime() <= asOf.getTime();
    });

    if (usable.length === 0) {
      features.push({
        sku,
        retailer,
        region,
        forecastWindow: "next_7_days",
        asOf: asOfIso,
        demand_signal_count: null,
        demand_up_count: null,
        demand_down_count: null,
        net_demand_signal: null,
        promotion_active: null,
        promotion_store_count: null,
        competitor_pressure_score: null,
        customer_interest_score: null,
        seasonal_signal_score: null,
        supply_disruption_score: null,
        stockout_risk_indicator: null,
        signal_confidence: null,
        feature_freshness_hours: null,
        sourceSignalIds: [],
      });
      continue;
    }

    const demandSignals = usable.filter((s) => !s.isSupplyRisk);
    const up = demandSignals.filter((s) => s.direction === "INCREASE");
    const down = demandSignals.filter((s) => s.direction === "DECREASE");
    const promotions = usable.filter((s) => s.category === "PROMOTION");
    const supplyScore = scoreByCategory(usable, "SUPPLY_DISRUPTION");
    const newest = usable
      .map((s) => new Date(s.extractedAt).getTime())
      .reduce((a, b) => Math.max(a, b), 0);

    const demandCount = demandSignals.length;
    const net =
      demandCount === 0
        ? null
        : round4((up.length - down.length) / demandCount);

    features.push({
      sku,
      retailer,
      region,
      forecastWindow: "next_7_days",
      asOf: asOfIso,
      demand_signal_count: demandCount,
      demand_up_count: up.length,
      demand_down_count: down.length,
      net_demand_signal: net,
      promotion_active: promotions.length > 0 ? 1 : 0,
      promotion_store_count: promotions.length > 0 ? 1 : 0,
      competitor_pressure_score: scoreByCategory(
        usable,
        "COMPETITOR_ACTIVITY",
      ),
      customer_interest_score: scoreByCategory(
        usable,
        "CUSTOMER_PREFERENCE",
      ),
      seasonal_signal_score: scoreByCategory(usable, "SEASONALITY"),
      supply_disruption_score: supplyScore,
      stockout_risk_indicator:
        supplyScore == null ? null : supplyScore >= 0.5 ? 1 : 0,
      signal_confidence: avg(usable.map((s) => s.confidence)),
      feature_freshness_hours: round4(
        Math.max(0, (asOf.getTime() - newest) / 3_600_000),
      ),
      sourceSignalIds: usable.map((s) => s.signalId),
    });
  }

  return features.sort((a, b) =>
    `${a.sku}${a.retailer}${a.region}`.localeCompare(
      `${b.sku}${b.retailer}${b.region}`,
    ),
  );
}

export function filterFeatures(
  features: FeatureRecord[],
  filters: {
    sku?: string | null;
    retailer?: string | null;
    region?: string | null;
  },
): FeatureRecord[] {
  return features.filter((f) => {
    if (filters.sku && f.sku !== filters.sku) return false;
    if (filters.retailer && f.retailer !== filters.retailer) return false;
    if (filters.region && f.region !== filters.region) return false;
    return true;
  });
}
