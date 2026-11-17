"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PipelineStatus } from "@/components/layout/pipeline-status";
import { OverviewDashboard } from "@/components/dashboard/overview";
import { WorkflowNext } from "@/components/dashboard/workflow-next";
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
          runFullDemo={state.runFullDemo}
          analyze={state.analyze}
          loading={state.loading}
          error={state.error}
          ready={state.ready}
          stage={state.stage}
          aiConfigured={state.aiConfigured}
        />
      )}

      {state.view !== "upload" && !state.analysis && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center">
          <p className="text-slate-300">
            No analysis yet. Upload data or run the full demo first.
          </p>
          <Button className="mt-4" onClick={() => state.setView("upload")}>
            Go to Ingest
          </Button>
        </div>
      )}

      {state.analysis && state.view === "overview" && (
        <div className="space-y-4">
          <PipelineStatus stage={state.stage} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => void state.runFullDemo()}>
              Re-run full demo
            </Button>
            <Button variant="ghost" onClick={state.clearAnalysis}>
              Clear analysis
            </Button>
          </div>
          <WorkflowNext onNavigate={state.setView} />
          <OverviewDashboard analysis={state.analysis} />
        </div>
      )}

      {state.analysis && state.view === "signals" && (
        <div className="space-y-4">
          <PipelineStatus stage={state.stage} />
          <SignalExplorer analysis={state.analysis} />
        </div>
      )}

      {state.analysis && state.view === "features" && (
        <div className="space-y-4">
          <PipelineStatus stage={state.stage} />
          <FeatureStore analysis={state.analysis} />
        </div>
      )}

      {state.analysis && state.view === "copilot" && (
        <div className="space-y-4">
          <PipelineStatus stage={state.stage} />
          <CopilotPanel analysis={state.analysis} />
        </div>
      )}
    </AppShell>
  );
}
