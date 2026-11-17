"use client";

import { AlertCircle, FileSpreadsheet, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PipelineStatus } from "@/components/layout/pipeline-status";
import type { PipelineStage } from "@/hooks/use-analysis";
import type { BusinessNote, SalesRow } from "@/types/domain";

export function IngestPanel({
  sales,
  notes,
  salesIssues,
  notesIssues,
  pastedNotes,
  setPastedNotes,
  applyPastedNotes,
  onSalesFile,
  onNotesFile,
  loadDemo,
  runFullDemo,
  analyze,
  loading,
  error,
  ready,
  stage,
  aiConfigured,
}: {
  sales: SalesRow[];
  notes: BusinessNote[];
  salesIssues: string[];
  notesIssues: string[];
  pastedNotes: string;
  setPastedNotes: (value: string) => void;
  applyPastedNotes: () => void;
  onSalesFile: (file: File) => void;
  onNotesFile: (file: File) => void;
  loadDemo: () => Promise<unknown>;
  runFullDemo: () => Promise<void>;
  analyze: () => Promise<void>;
  loading: boolean;
  error: string | null;
  ready: boolean;
  stage: PipelineStage;
  aiConfigured: boolean | null;
}) {
  return (
    <div className="space-y-6">
      <PipelineStatus stage={stage} />

      <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50/80 to-white">
        <CardHeader>
          <CardTitle>Hackathon demo — one click</CardTitle>
          <CardDescription>
            Loads synthetic sales + business notes, runs live AI extraction,
            then opens the overview with signals and forecasting features.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button size="lg" disabled={loading} onClick={() => void runFullDemo()}>
            <Play className="h-4 w-4" />
            {loading ? "Running full demo…" : "Run Full Demo"}
          </Button>
          <Button
            variant="secondary"
            disabled={loading}
            onClick={() => void loadDemo()}
          >
            <Sparkles className="h-4 w-4" />
            Load demo data only
          </Button>
          {aiConfigured === false && (
            <p className="text-sm text-amber-800">
              AI key missing — set OPENROUTER_API_KEY or GROQ_API_KEY in
              .env.local (and matching AI_PROVIDER) before analyzing.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingest demand context</CardTitle>
          <CardDescription>
            Upload historical sales and unstructured business notes. AI extracts
            events; deterministic TypeScript calculates numerical features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <a href="/demo/sales.csv" download>
              <Button variant="ghost" type="button">
                Sample sales CSV
              </Button>
            </a>
            <a href="/demo/business-notes.csv" download>
              <Button variant="ghost" type="button">
                Sample notes CSV
              </Button>
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                <FileSpreadsheet className="h-4 w-4 text-cyan-700" />
                Historical sales CSV
              </div>
              <p className="mb-3 text-xs text-slate-500">
                Required: date, sku, product_name, retailer, region, units_sold,
                revenue
              </p>
              <input
                type="file"
                accept=".csv,text/csv"
                className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-slate-800 file:shadow-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onSalesFile(file);
                }}
              />
              <p className="mt-3 text-xs text-emerald-700">
                {sales.length} sales rows loaded
              </p>
              {salesIssues.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-rose-700">
                  {salesIssues.slice(0, 5).map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}
            </label>

            <label className="block rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                <FileSpreadsheet className="h-4 w-4 text-cyan-700" />
                Business notes CSV
              </div>
              <p className="mb-3 text-xs text-slate-500">
                Required: date, note. Optional: retailer, region, id
              </p>
              <input
                type="file"
                accept=".csv,text/csv"
                className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-slate-800 file:shadow-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onNotesFile(file);
                }}
              />
              <p className="mt-3 text-xs text-emerald-700">
                {notes.length} notes loaded
              </p>
              {notesIssues.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-rose-700">
                  {notesIssues.slice(0, 5).map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}
            </label>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 text-sm font-medium text-slate-800">
              Or paste notes directly
            </p>
            <textarea
              value={pastedNotes}
              onChange={(e) => setPastedNotes(e.target.value)}
              placeholder="Paste retailer commentary, one note per line or CSV with date,note columns…"
              className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-600/30"
            />
            <div className="mt-3">
              <Button type="button" variant="secondary" onClick={applyPastedNotes}>
                Apply pasted notes
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Live AI analysis failed</p>
                <p>{error}</p>
                <p className="mt-1 text-xs text-rose-700/80">
                  {/OPENROUTER_API_KEY|GROQ_API_KEY|API key/i.test(error)
                    ? "Configure the matching AI provider key in .env.local."
                    : "No mock results were substituted. Retry the demo or check provider rate limits."}
                </p>
              </div>
            </div>
          )}

          <Button
            size="lg"
            disabled={!ready || loading}
            onClick={() => void analyze()}
          >
            {loading ? "Analyzing with AI…" : "Analyze Signals"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
