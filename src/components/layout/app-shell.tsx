"use client";

import {
  Activity,
  LayoutDashboard,
  MessageSquareText,
  Radar,
  Table2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppView } from "@/types/domain";
import { Badge } from "@/components/ui/badge";

const NAV: Array<{ id: AppView; label: string; icon: React.ElementType }> = [
  { id: "upload", label: "Ingest", icon: Upload },
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "signals", label: "Signal Explorer", icon: Radar },
  { id: "features", label: "Feature Store", icon: Table2 },
  { id: "copilot", label: "AI Copilot", icon: MessageSquareText },
];

export function AppShell({
  view,
  onViewChange,
  children,
  demoMode,
  hasAnalysis,
  aiConfigured,
}: {
  view: AppView;
  onViewChange: (view: AppView) => void;
  children: React.ReactNode;
  demoMode: boolean;
  hasAnalysis: boolean;
  aiConfigured: boolean | null;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#13233f_0%,_#0b1220_45%,_#070b14_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 md:px-6">
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-800/80 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-white">
                  DemandPulse AI
                </h1>
                <p className="text-xs text-slate-400">
                  Turn hidden business signals into intelligent demand features.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {demoMode && (
              <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-200">
                Demo dataset
              </Badge>
            )}
            <Badge
              className={
                aiConfigured
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-500/40 bg-rose-500/10 text-rose-200"
              }
            >
              {aiConfigured == null
                ? "Checking AI…"
                : aiConfigured
                  ? "Groq configured"
                  : "Groq key missing"}
            </Badge>
            <Badge className="border-slate-600 text-slate-300">
              {hasAnalysis ? "Analysis ready" : "Awaiting upload"}
            </Badge>
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[220px_1fr]">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "flex min-w-[140px] items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    active
                      ? "bg-sky-500/15 text-sky-200 ring-1 ring-sky-500/30"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
