import { createSignalId } from "@/lib/utils";
import type {
  DemandSignal,
  SalesRow,
  SignalCategory,
  ValidationStatus,
} from "@/types/domain";
import type { ExtractedSignal } from "@/schemas/signal";

const SUPPLY_CATEGORIES: SignalCategory[] = ["SUPPLY_DISRUPTION"];

function normalizeNullable(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveAgainstCatalog(
  value: string | null,
  catalog: Set<string>,
): string | null {
  if (!value) return null;
  const exact = Array.from(catalog).find(
    (item) => item.toLowerCase() === value.toLowerCase(),
  );
  return exact ?? null;
}

export function validateAndNormalizeSignals(
  extracted: ExtractedSignal[],
  sales: SalesRow[],
): DemandSignal[] {
  const skus = new Set(sales.map((s) => s.sku));
  const retailers = new Set(sales.map((s) => s.retailer));
  const regions = new Set(sales.map((s) => s.region));
  const productNames = new Set(sales.map((s) => s.product_name));
  const now = new Date().toISOString();

  const seen = new Set<string>();
  const signals: DemandSignal[] = [];

  extracted.forEach((item, index) => {
    const sku = resolveAgainstCatalog(normalizeNullable(item.sku), skus);
    const retailer = resolveAgainstCatalog(
      normalizeNullable(item.retailer),
      retailers,
    );
    const region = resolveAgainstCatalog(
      normalizeNullable(item.region),
      regions,
    );
    const productName = resolveAgainstCatalog(
      normalizeNullable(item.productName),
      productNames,
    );

    // If LLM invented an entity not in catalog, drop it (do not guess).
    const unresolved =
      (normalizeNullable(item.sku) && !sku) ||
      (normalizeNullable(item.retailer) && !retailer) ||
      (normalizeNullable(item.region) && !region) ||
      (normalizeNullable(item.productName) && !productName);

    let validationStatus: ValidationStatus = "VALID";
    if (unresolved) validationStatus = "UNRESOLVED_ENTITIES";
    else if (!sku || !retailer || !region) validationStatus = "PARTIAL";

    const fingerprint = [
      item.sourceId,
      item.category,
      item.direction,
      (item.evidence || "").slice(0, 80).toLowerCase(),
      sku ?? "null",
      retailer ?? "null",
      region ?? "null",
    ].join("|");

    if (seen.has(fingerprint)) return;
    seen.add(fingerprint);

    signals.push({
      signalId: createSignalId(index),
      sourceId: item.sourceId,
      sku,
      productName,
      retailer,
      region,
      category: item.category,
      description: item.description.trim(),
      direction: item.direction,
      confidence: Math.max(0, Math.min(1, item.confidence)),
      potentialImpact: Math.max(0, Math.min(1, item.potentialImpact)),
      startDate: normalizeNullable(item.startDate),
      endDate: normalizeNullable(item.endDate),
      evidence: item.evidence.trim(),
      explanation: item.explanation.trim(),
      extractedAt: now,
      validationStatus,
      isSupplyRisk: SUPPLY_CATEGORIES.includes(item.category),
    });
  });

  return signals;
}
