"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnalysisResult } from "@/types/domain";

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function OverviewDashboard({ analysis }: { analysis: AnalysisResult }) {
  const demandUp = analysis.signals.filter(
    (s) => !s.isSupplyRisk && s.direction === "INCREASE",
  ).length;
  const demandDown = analysis.signals.filter(
    (s) => !s.isSupplyRisk && s.direction === "DECREASE",
  ).length;
  const supply = analysis.signals.filter((s) => s.isSupplyRisk).length;
  const skus = new Set(
    analysis.signals.map((s) => s.sku).filter(Boolean) as string[],
  ).size;

  const byCategory = Object.entries(
    analysis.signals.reduce<Record<string, number>>((acc, signal) => {
      acc[signal.category] = (acc[signal.category] || 0) + 1;
      return acc;
    }, {}),
  ).map(([category, count]) => ({ category, count }));

  const topProducts = Object.entries(
    analysis.signals.reduce<Record<string, number>>((acc, signal) => {
      const key = signal.productName || signal.sku || "Unresolved";
      acc[key] = (acc[key] || 0) + (signal.potentialImpact || 0);
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const freshness =
    analysis.features
      .map((f) => f.feature_freshness_hours)
      .filter((v): v is number => v != null)
      .sort((a, b) => a - b)[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>Run {analysis.runId}</Badge>
        <Badge className="border-sky-500/30 bg-sky-500/10 text-sky-200">
          {analysis.provider}/{analysis.model}
        </Badge>
        {analysis.demoMode && (
          <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-200">
            Synthetic demo data — not real market data
          </Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="Signals extracted" value={analysis.signals.length} />
        <Metric label="Demand increase" value={demandUp} />
        <Metric label="Demand decrease" value={demandDown} />
        <Metric label="Supply disruption alerts" value={supply} />
        <Metric label="Affected SKUs" value={skus} />
        <Metric
          label="Feature freshness"
          value={freshness == null ? "—" : `${freshness.toFixed(2)}h`}
          hint="Hours since newest contributing signal"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Signal distribution by category</CardTitle>
            <CardDescription>
              AI-extracted event categories (semantic). Numerical features are
              calculated separately.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="category"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={70}
                />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top affected products</CardTitle>
            <CardDescription>
              Ranked by summed potential impact of related signals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {topProducts.map(([name, score]) => (
                <li
                  key={name}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2"
                >
                  <span className="text-sm text-slate-200">{name}</span>
                  <span className="text-sm font-medium text-sky-300">
                    {score.toFixed(2)}
                  </span>
                </li>
              ))}
              {topProducts.length === 0 && (
                <li className="text-sm text-slate-400">No signals available.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent signals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.signals.slice(0, 6).map((signal) => (
              <div
                key={signal.signalId}
                className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-3"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge>{signal.category}</Badge>
                  <Badge
                    className={
                      signal.isSupplyRisk
                        ? "border-rose-500/40 text-rose-200"
                        : "border-emerald-500/40 text-emerald-200"
                    }
                  >
                    {signal.isSupplyRisk ? "Supply risk" : "Demand signal"}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    confidence {(signal.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-slate-200">{signal.description}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Evidence: {signal.evidence}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
