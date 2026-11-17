"use client";

import {
  Activity,
  Home,
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
  { id: "home", label: "Home", icon: Home },
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
    <div className="min-h-screen text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 md:px-6">
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-200/90 pb-4 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={() => onViewChange("home")}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-700 text-white shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-slate-900">
                DemandPulse AI
              </h1>
              <p className="text-xs text-slate-500">
                Turn hidden business signals into intelligent demand features.
              </p>
            </div>
          </button>
          <div className="flex flex-wrap items-center gap-2">
            {demoMode && (
              <Badge className="border-amber-300 bg-amber-50 text-amber-800">
                Demo dataset
              </Badge>
            )}
            <Badge
              className={
                aiConfigured
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-rose-300 bg-rose-50 text-rose-800"
              }
            >
              {aiConfigured == null
                ? "Checking AI…"
                : aiConfigured
                  ? "AI configured"
                  : "AI key missing"}
            </Badge>
            <Badge>
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
                    "flex min-w-[140px] items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                    active
                      ? "bg-cyan-700 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm",
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
