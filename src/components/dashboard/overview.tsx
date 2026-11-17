"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
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

const CHART = {
  grid: "#e2e8f0",
  tick: "#64748b",
  tooltip: {
    background: "#ffffff",
    border: "1px solid #dbe3ef",
    borderRadius: 10,
    color: "#0f172a",
  },
};

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
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-slate-900">
          {value}
        </p>
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

  const demandVsSupply = [
    { name: "Demand signals", value: analysis.signals.filter((s) => !s.isSupplyRisk).length, fill: "#0e7490" },
    { name: "Supply risk", value: supply, fill: "#e11d48" },
  ];

  const byRegion = Object.entries(
    analysis.signals.reduce<Record<string, { demand: number; supply: number }>>(
      (acc, signal) => {
        const region = signal.region || "Unresolved";
        if (!acc[region]) acc[region] = { demand: 0, supply: 0 };
        if (signal.isSupplyRisk) acc[region].supply += 1;
        else acc[region].demand += 1;
        return acc;
      },
      {},
    ),
  ).map(([region, counts]) => ({ region, ...counts }));

  const confidenceImpact = analysis.signals.map((s) => ({
    confidence: Number((s.confidence * 100).toFixed(1)),
    impact: Number((s.potentialImpact * 100).toFixed(1)),
    category: s.category,
    label: s.sku || s.productName || s.category,
  }));

  const netBySku = analysis.features
    .filter((f) => f.net_demand_signal != null)
    .map((f) => ({
      key: `${f.sku}`,
      net: f.net_demand_signal as number,
      supply: f.supply_disruption_score ?? 0,
      competitor: f.competitor_pressure_score ?? 0,
    }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
    .slice(0, 8);

  const riskRadar = (() => {
    const avg = (vals: Array<number | null>) => {
      const nums = vals.filter((v): v is number => v != null);
      if (!nums.length) return 0;
      return Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(3));
    };
    return [
      {
        metric: "Competitor",
        score: avg(analysis.features.map((f) => f.competitor_pressure_score)),
      },
      {
        metric: "Customer interest",
        score: avg(analysis.features.map((f) => f.customer_interest_score)),
      },
      {
        metric: "Seasonality",
        score: avg(analysis.features.map((f) => f.seasonal_signal_score)),
      },
      {
        metric: "Supply disruption",
        score: avg(analysis.features.map((f) => f.supply_disruption_score)),
      },
      {
        metric: "Promotion intensity",
        score: avg(analysis.features.map((f) => f.promotion_active)),
      },
    ];
  })();

  const salesTrend = (() => {
    const rows = analysis.salesSnapshot ?? [];
    const byDate = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.date] = (acc[row.date] || 0) + row.units_sold;
      return acc;
    }, {});
    return Object.entries(byDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, units]) => ({ date: date.slice(5), units }));
  })();

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

  const avgConfidence =
    analysis.signals.length === 0
      ? null
      : analysis.signals.reduce((a, s) => a + s.confidence, 0) /
        analysis.signals.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>Run {analysis.runId}</Badge>
        <Badge className="border-cyan-200 bg-cyan-50 text-cyan-900">
          {analysis.provider}/{analysis.model}
        </Badge>
        {analysis.demoMode && (
          <Badge className="border-amber-300 bg-amber-50 text-amber-800">
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
          label="Avg signal confidence"
          value={avgConfidence == null ? "—" : `${(avgConfidence * 100).toFixed(0)}%`}
          hint={
            freshness == null
              ? "Across extracted events"
              : `Freshness ${freshness.toFixed(2)}h`
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Demand vs supply risk mix</CardTitle>
            <CardDescription>
              Demand intelligence is kept separate from supply constraints.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={demandVsSupply}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {demandVsSupply.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART.tooltip} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signal pressure by region</CardTitle>
            <CardDescription>
              Where demand events and supply disruptions are concentrating.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byRegion}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="region" tick={{ fill: CHART.tick, fontSize: 12 }} />
                <YAxis tick={{ fill: CHART.tick, fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={CHART.tooltip} />
                <Legend />
                <Bar dataKey="demand" stackId="a" fill="#0e7490" radius={[0, 0, 0, 0]} />
                <Bar dataKey="supply" stackId="a" fill="#e11d48" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Confidence vs potential impact</CardTitle>
            <CardDescription>
              High-confidence / high-impact events deserve forecast attention first.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis
                  type="number"
                  dataKey="confidence"
                  name="Confidence %"
                  unit="%"
                  tick={{ fill: CHART.tick, fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="impact"
                  name="Impact %"
                  unit="%"
                  tick={{ fill: CHART.tick, fontSize: 12 }}
                />
                <ZAxis range={[60, 200]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={CHART.tooltip}
                />
                <Scatter data={confidenceImpact} fill="#0284c7" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature risk radar</CardTitle>
            <CardDescription>
              Average deterministic feature scores across the feature store.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={riskRadar}>
                <PolarGrid stroke={CHART.grid} />
                <PolarAngleAxis dataKey="metric" tick={{ fill: CHART.tick, fontSize: 11 }} />
                <Radar
                  dataKey="score"
                  stroke="#0e7490"
                  fill="#14b8a6"
                  fillOpacity={0.35}
                />
                <Tooltip contentStyle={CHART.tooltip} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Net demand signal by SKU</CardTitle>
            <CardDescription>
              Deterministic net demand feature (−1 to +1) from extracted events.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={netBySku} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis type="number" domain={[-1, 1]} tick={{ fill: CHART.tick, fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="key"
                  width={70}
                  tick={{ fill: CHART.tick, fontSize: 12 }}
                />
                <Tooltip contentStyle={CHART.tooltip} />
                <Bar dataKey="net" fill="#0284c7" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historical units trend</CardTitle>
            <CardDescription>
              Sales snapshot context used to ground entity resolution.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {salesTrend.length === 0 ? (
              <p className="pt-10 text-center text-sm text-slate-500">
                No sales snapshot available for this run.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                  <XAxis dataKey="date" tick={{ fill: CHART.tick, fontSize: 11 }} />
                  <YAxis tick={{ fill: CHART.tick, fontSize: 12 }} />
                  <Tooltip contentStyle={CHART.tooltip} />
                  <Area
                    type="monotone"
                    dataKey="units"
                    stroke="#0e7490"
                    fill="#99f6e4"
                    fillOpacity={0.55}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Signal distribution by category</CardTitle>
            <CardDescription>
              AI-extracted event categories. Numerical features are calculated separately.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis
                  dataKey="category"
                  tick={{ fill: CHART.tick, fontSize: 10 }}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={70}
                />
                <YAxis tick={{ fill: CHART.tick, fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={CHART.tooltip} />
                <Bar dataKey="count" fill="#0e7490" radius={[6, 6, 0, 0]} />
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
              {topProducts.map(([name, score], index) => (
                <li
                  key={name}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <span className="text-sm text-slate-800">
                    <span className="mr-2 text-xs font-semibold text-slate-400">
                      #{index + 1}
                    </span>
                    {name}
                  </span>
                  <span className="text-sm font-semibold text-cyan-800">
                    {score.toFixed(2)}
                  </span>
                </li>
              ))}
              {topProducts.length === 0 && (
                <li className="text-sm text-slate-500">No signals available.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent signals</CardTitle>
          <CardDescription>
            Latest extracted events with evidence snippets for judge walkthroughs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.signals.slice(0, 6).map((signal) => (
              <div
                key={signal.signalId}
                className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge>{signal.category}</Badge>
                  <Badge
                    className={
                      signal.isSupplyRisk
                        ? "border-rose-200 bg-rose-50 text-rose-800"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800"
                    }
                  >
                    {signal.isSupplyRisk ? "Supply risk" : "Demand signal"}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    confidence {(signal.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-slate-800">{signal.description}</p>
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
