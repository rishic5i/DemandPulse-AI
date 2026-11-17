"use client";

import { AppShell } from "@/components/layout/app-shell";
import { OverviewDashboard } from "@/components/dashboard/overview";
import { SignalExplorer } from "@/components/signals/signal-explorer";
import { FeatureStore } from "@/components/features/feature-store";
import { CopilotPanel } from "@/components/copilot/copilot-panel";
import { IngestPanel } from "@/components/upload/ingest-panel";
import { Button } from "@/components/ui/button";
import { useAnalysis } from "@/hooks/use-analysis";

export default function HomePage() {
  const state = useAnalysis();

  return (
    <AppShell
      view={state.view}
      onViewChange={state.setView}
      demoMode={state.demoMode}
      hasAnalysis={Boolean(state.analysis)}
      aiConfigured={state.aiConfigured}
    >
      {state.view === "upload" && (
        <IngestPanel
          sales={state.sales}
          notes={state.notes}
          salesIssues={state.salesIssues}
          notesIssues={state.notesIssues}
          pastedNotes={state.pastedNotes}
          setPastedNotes={state.setPastedNotes}
          applyPastedNotes={state.applyPastedNotes}
          onSalesFile={state.onSalesFile}
          onNotesFile={state.onNotesFile}
          loadDemo={state.loadDemo}
          analyze={state.analyze}
          loading={state.loading}
          error={state.error}
          ready={state.ready}
        />
      )}

      {state.view !== "upload" && !state.analysis && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center">
          <p className="text-slate-300">
            No analysis yet. Upload data or load the demo dataset first.
          </p>
          <Button className="mt-4" onClick={() => state.setView("upload")}>
            Go to Ingest
          </Button>
        </div>
      )}

      {state.analysis && state.view === "overview" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="ghost" onClick={state.clearAnalysis}>
              Clear analysis
            </Button>
          </div>
          <OverviewDashboard analysis={state.analysis} />
        </div>
      )}

      {state.analysis && state.view === "signals" && (
        <SignalExplorer analysis={state.analysis} />
      )}

      {state.analysis && state.view === "features" && (
        <FeatureStore analysis={state.analysis} />
      )}

      {state.analysis && state.view === "copilot" && (
        <CopilotPanel analysis={state.analysis} />
      )}
    </AppShell>
  );
}
