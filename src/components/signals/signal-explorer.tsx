"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnalysisResult, DemandSignal, FeatureRecord } from "@/types/domain";

export function SignalExplorer({ analysis }: { analysis: AnalysisResult }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    analysis.signals[0]?.signalId ?? null,
  );
  const [sku, setSku] = useState("");
  const [retailer, setRetailer] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [direction, setDirection] = useState("");
  const [minConfidence, setMinConfidence] = useState("0");

  const filtered = useMemo(() => {
    const min = Number(minConfidence) || 0;
    return analysis.signals.filter((signal) => {
      if (sku && signal.sku !== sku) return false;
      if (retailer && signal.retailer !== retailer) return false;
      if (region && signal.region !== region) return false;
      if (category && signal.category !== category) return false;
      if (direction && signal.direction !== direction) return false;
      if (signal.confidence < min) return false;
      return true;
    });
  }, [analysis.signals, sku, retailer, region, category, direction, minConfidence]);

  const selected =
    filtered.find((s) => s.signalId === selectedId) || filtered[0] || null;

  const relatedFeatures: FeatureRecord[] = selected
    ? analysis.features.filter((f) =>
        f.sourceSignalIds.includes(selected.signalId),
      )
    : [];

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>Signal Explorer</CardTitle>
          <CardDescription>
            Search and inspect extracted events with source evidence.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <FilterInput label="SKU" value={sku} onChange={setSku} placeholder="SKU001" />
            <FilterInput
              label="Retailer"
              value={retailer}
              onChange={setRetailer}
              placeholder="Retailer A"
            />
            <FilterInput
              label="Region"
              value={region}
              onChange={setRegion}
              placeholder="North"
            />
            <FilterInput
              label="Category"
              value={category}
              onChange={setCategory}
              placeholder="PROMOTION"
            />
            <FilterInput
              label="Direction"
              value={direction}
              onChange={setDirection}
              placeholder="INCREASE"
            />
            <FilterInput
              label="Min confidence"
              value={minConfidence}
              onChange={setMinConfidence}
              placeholder="0.5"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Direction</th>
                  <th className="px-3 py-2">Conf.</th>
                  <th className="px-3 py-2">Impact</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((signal) => (
                  <tr
                    key={signal.signalId}
                    onClick={() => setSelectedId(signal.signalId)}
                    className={`cursor-pointer border-t border-slate-200 hover:bg-cyan-50 ${
                      selected?.signalId === signal.signalId
                        ? "bg-cyan-50"
                        : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-slate-800">{signal.category}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {signal.sku ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{signal.direction}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {(signal.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {(signal.potentialImpact * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="px-3 py-6 text-sm text-slate-500">
                No signals match the current filters.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <SignalDetail signal={selected} features={relatedFeatures} />
    </div>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block text-xs text-slate-500">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-cyan-600/30"
      />
    </label>
  );
}

function SignalDetail({
  signal,
  features,
}: {
  signal: DemandSignal | null;
  features: FeatureRecord[];
}) {
  if (!signal) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-slate-500">
          Select a signal to inspect evidence and lineage.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signal detail</CardTitle>
        <CardDescription>{signal.signalId}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-2">
          <Badge>{signal.category}</Badge>
          <Badge>{signal.direction}</Badge>
          <Badge
            className={
              signal.isSupplyRisk
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }
          >
            {signal.isSupplyRisk ? "Supply risk" : "Demand"}
          </Badge>
          <Badge>{signal.validationStatus}</Badge>
        </div>

        <Section title="Extracted event" body={signal.description} />
        <Section title="AI explanation" body={signal.explanation} />
        <Section title="Evidence from source note" body={signal.evidence} />

        <div className="grid grid-cols-2 gap-3">
          <KV label="SKU" value={signal.sku} />
          <KV label="Product" value={signal.productName} />
          <KV label="Retailer" value={signal.retailer} />
          <KV label="Region" value={signal.region} />
          <KV label="Confidence" value={`${(signal.confidence * 100).toFixed(0)}%`} />
          <KV
            label="Potential impact"
            value={`${(signal.potentialImpact * 100).toFixed(0)}%`}
          />
          <KV label="Source ID" value={signal.sourceId} />
          <KV label="Extracted at" value={signal.extractedAt} />
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
            Associated features
          </p>
          {features.length === 0 ? (
            <p className="text-slate-500">
              No feature rows cite this signal (entity may be unresolved).
            </p>
          ) : (
            <ul className="space-y-2">
              {features.map((f) => (
                <li
                  key={`${f.sku}-${f.retailer}-${f.region}`}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                >
                  {f.sku} · {f.retailer} · {f.region} · net{" "}
                  {f.net_demand_signal ?? "null"} · supply{" "}
                  {f.supply_disruption_score ?? "null"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800">
        {body}
      </p>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-slate-800">{value ?? "unresolved"}</p>
    </div>
  );
}
