"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PipelineStatus } from "@/components/layout/pipeline-status";
import { OverviewDashboard } from "@/components/dashboard/overview";
import { WorkflowNext } from "@/components/dashboard/workflow-next";
import { SignalExplorer } from "@/components/signals/signal-explorer";
import { FeatureStore } from "@/components/features/feature-store";
import { CopilotPanel } from "@/components/copilot/copilot-panel";
import { IngestPanel } from "@/components/upload/ingest-panel";
import { HomeLanding } from "@/components/home/landing";
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
      {state.view === "home" && (
        <HomeLanding
          loading={state.loading}
          onStartDemo={() => void state.runFullDemo()}
          onIngest={() => state.setView("upload")}
        />
      )}

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

      {state.view !== "upload" &&
        state.view !== "home" &&
        !state.analysis && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">
              No analysis yet. Start from Home with the full demo, or upload data.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={() => state.setView("home")}>Go to Home</Button>
              <Button variant="secondary" onClick={() => state.setView("upload")}>
                Go to Ingest
              </Button>
            </div>
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
