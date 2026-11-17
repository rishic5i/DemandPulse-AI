"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { downloadBlob } from "@/lib/utils";
import { filterFeatures } from "@/modules/features/generate";
import type { AnalysisResult } from "@/types/domain";

export function FeatureStore({ analysis }: { analysis: AnalysisResult }) {
  const [sku, setSku] = useState("");
  const [retailer, setRetailer] = useState("");
  const [showApi, setShowApi] = useState(false);

  const features = useMemo(
    () =>
      filterFeatures(analysis.features, {
        sku: sku || null,
        retailer: retailer || null,
      }),
    [analysis.features, sku, retailer],
  );

  const exportCsv = () => {
    const rows = features.map((f) => ({
      sku: f.sku,
      retailer: f.retailer,
      region: f.region,
      forecastWindow: f.forecastWindow,
      asOf: f.asOf,
      demand_signal_count: f.demand_signal_count,
      demand_up_count: f.demand_up_count,
      demand_down_count: f.demand_down_count,
      net_demand_signal: f.net_demand_signal,
      promotion_active: f.promotion_active,
      promotion_store_count: f.promotion_store_count,
      competitor_pressure_score: f.competitor_pressure_score,
      customer_interest_score: f.customer_interest_score,
      seasonal_signal_score: f.seasonal_signal_score,
      supply_disruption_score: f.supply_disruption_score,
      stockout_risk_indicator: f.stockout_risk_indicator,
      signal_confidence: f.signal_confidence,
      feature_freshness_hours: f.feature_freshness_hours,
      sourceSignalIds: f.sourceSignalIds.join("|"),
    }));
    const csv = Papa.unparse(rows);
    downloadBlob(`demandpulse-features-${analysis.runId}.csv`, csv, "text/csv");
  };

  const exportJson = () => {
    downloadBlob(
      `demandpulse-features-${analysis.runId}.json`,
      JSON.stringify({ runId: analysis.runId, features }, null, 2),
      "application/json",
    );
  };

  const apiPreview = {
    requestId: "preview",
    runId: analysis.runId,
    count: features.length,
    features,
    storage: "client-held (stateless API)",
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Feature Store</CardTitle>
          <CardDescription>
            Deterministic numerical features for forecasting systems. Null means
            missing evidence; 0 means measured zero.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs text-slate-400">
              SKU
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="mt-1 block rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
                placeholder="SKU001"
              />
            </label>
            <label className="text-xs text-slate-400">
              Retailer
              <input
                value={retailer}
                onChange={(e) => setRetailer(e.target.value)}
                className="mt-1 block rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
                placeholder="Retailer A"
              />
            </label>
            <Button onClick={exportCsv} variant="secondary">
              Export CSV
            </Button>
            <Button onClick={exportJson} variant="secondary">
              Export JSON
            </Button>
            <Button onClick={() => setShowApi((v) => !v)} variant="ghost">
              {showApi ? "Hide API preview" : "Preview API response"}
            </Button>
            <Badge>{features.length} feature rows</Badge>
          </div>

          {showApi && (
            <pre className="max-h-64 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
              {JSON.stringify(apiPreview, null, 2)}
            </pre>
          )}

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="min-w-[1100px] text-left text-xs">
              <thead className="bg-slate-950/80 uppercase text-slate-400">
                <tr>
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Retailer</th>
                  <th className="px-3 py-2">Region</th>
                  <th className="px-3 py-2">Net demand</th>
                  <th className="px-3 py-2">Promo</th>
                  <th className="px-3 py-2">Competitor</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Seasonal</th>
                  <th className="px-3 py-2">Supply risk</th>
                  <th className="px-3 py-2">Confidence</th>
                  <th className="px-3 py-2">Freshness h</th>
                  <th className="px-3 py-2">Lineage</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f) => (
                  <tr
                    key={`${f.sku}-${f.retailer}-${f.region}`}
                    className="border-t border-slate-800/80 text-slate-200"
                  >
                    <td className="px-3 py-2">{f.sku}</td>
                    <td className="px-3 py-2">{f.retailer}</td>
                    <td className="px-3 py-2">{f.region}</td>
                    <td className="px-3 py-2">{fmt(f.net_demand_signal)}</td>
                    <td className="px-3 py-2">{fmt(f.promotion_active)}</td>
                    <td className="px-3 py-2">
                      {fmt(f.competitor_pressure_score)}
                    </td>
                    <td className="px-3 py-2">
                      {fmt(f.customer_interest_score)}
                    </td>
                    <td className="px-3 py-2">{fmt(f.seasonal_signal_score)}</td>
                    <td className="px-3 py-2">
                      {fmt(f.supply_disruption_score)}
                    </td>
                    <td className="px-3 py-2">{fmt(f.signal_confidence)}</td>
                    <td className="px-3 py-2">
                      {fmt(f.feature_freshness_hours)}
                    </td>
                    <td className="px-3 py-2 text-slate-400">
                      {f.sourceSignalIds.join(", ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function fmt(value: number | null): string {
  return value == null ? "null" : String(value);
}
