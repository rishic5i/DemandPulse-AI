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
      return 0;
    case "loading_demo":
    case "ready":
      return 0;
    case "extracting":
      return 1;
    case "complete":
      return 3;
    case "error":
      return 1;
    default:
      return 0;
  }
}

export function PipelineStatus({ stage }: { stage: PipelineStage }) {
  const current = activeIndex(stage);

  return (
    <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
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
                "rounded-lg border px-3 py-2 text-xs",
                done && "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
                active && "border-sky-500/40 bg-sky-500/10 text-sky-200",
                !done && !active && "border-slate-800 text-slate-500",
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
