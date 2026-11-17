"use client";

import { ArrowRight, FileSpreadsheet, LineChart, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeLanding({
  onStartDemo,
  onIngest,
  loading,
}: {
  onStartDemo: () => void;
  onIngest: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef8fb_45%,#e8f1ff_100%)] px-6 py-12 md:px-12 md:py-16">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_40%,rgba(14,116,144,0.18),transparent_60%)] md:block" />
        <div className="relative max-w-2xl">
          <p className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            DemandPulse AI
          </p>
          <h2 className="mt-4 text-xl font-medium text-slate-800 md:text-2xl">
            Turn retailer notes into forecast-ready demand features.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
            Consumer-goods demand is shaped by promotions, competitors, preferences,
            events, and supply risk buried in unstructured commentary. DemandPulse
            extracts those signals with AI, then calculates transparent numerical
            features your forecasting systems can consume.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" disabled={loading} onClick={onStartDemo}>
              <Sparkles className="h-4 w-4" />
              {loading ? "Running demo…" : "Run Full Demo"}
            </Button>
            <Button size="lg" variant="secondary" onClick={onIngest}>
              Upload your data
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Demo uses clearly labeled synthetic data. Live extraction runs via the configured AI provider.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: FileSpreadsheet,
            title: "Ingest messy business context",
            body: "Sales history plus retailer notes, pasted commentary, or CSV uploads.",
          },
          {
            icon: Sparkles,
            title: "Extract explainable signals",
            body: "AI classifies demand vs supply events with evidence and confidence.",
          },
          {
            icon: LineChart,
            title: "Publish deterministic features",
            body: "TypeScript formulas create SKU/retailer/region features for forecasting APIs.",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-cyan-700" />
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-slate-900">
              Built for trustworthy forecasting enrichment
            </h3>
            <ul className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
              <li>AI never invents SKUs, retailers, regions, or quantities</li>
              <li>Demand signals stay separate from supply-risk indicators</li>
              <li>Every signal keeps source evidence and lineage</li>
              <li>Numerical features are calculated in deterministic TypeScript</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
