"use client";

import { cn } from "@/lib/utils";
import type { PipelineStage } from "@/hooks/use-analysis";

const STEPS = [
  { id: "ingest", label: "1. Ingest" },
  { id: "extract", label: "2. AI extract" },
  { id: "features", label: "3. Features" },
  { id: "explore", label: "4. Explore / export" },
] as const;

function activeIndex(stage: PipelineStage): number {
  switch (stage) {
    case "idle":
    case "loading_demo":
    case "ready":
      return 0;
    case "extracting":
    case "error":
      return 1;
    case "complete":
      return 3;
    default:
      return 0;
  }
}

export function PipelineStatus({ stage }: { stage: PipelineStage }) {
  const current = activeIndex(stage);

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          End-to-end pipeline
        </p>
        <p className="text-xs text-slate-500">
          {stage === "extracting" && "Live Groq extraction running…"}
          {stage === "loading_demo" && "Loading synthetic demo dataset…"}
          {stage === "ready" && "Data ready — run analysis"}
          {stage === "complete" && "Signals + features ready"}
          {stage === "error" && "Pipeline stopped — see error below"}
          {stage === "idle" && "Upload data or run the full demo"}
        </p>
      </div>
      <ol className="grid gap-2 sm:grid-cols-4">
        {STEPS.map((step, index) => {
          const done = index < current || stage === "complete";
          const active = index === current && stage !== "complete";
          return (
            <li
              key={step.id}
              className={cn(
                "rounded-xl border px-3 py-2 text-xs font-medium",
                done && "border-emerald-200 bg-emerald-50 text-emerald-800",
                active && "border-cyan-200 bg-cyan-50 text-cyan-900",
                !done && !active && "border-slate-200 bg-slate-50 text-slate-500",
              )}
            >
              {step.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
