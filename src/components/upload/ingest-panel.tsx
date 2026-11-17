"use client";

import { AlertCircle, FileSpreadsheet, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  analyze,
  loading,
  error,
  ready,
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
  loadDemo: () => Promise<void>;
  analyze: () => Promise<void>;
  loading: boolean;
  error: string | null;
  ready: boolean;
}) {
  return (
    <div className="space-y-6">
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
            <Button onClick={() => void loadDemo()} variant="secondary">
              <Sparkles className="h-4 w-4" />
              Try Demo
            </Button>
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
            <label className="block rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                <FileSpreadsheet className="h-4 w-4 text-sky-300" />
                Historical sales CSV
              </div>
              <p className="mb-3 text-xs text-slate-400">
                Required: date, sku, product_name, retailer, region, units_sold,
                revenue
              </p>
              <input
                type="file"
                accept=".csv,text/csv"
                className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-slate-100"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onSalesFile(file);
                }}
              />
              <p className="mt-3 text-xs text-emerald-300">
                {sales.length} sales rows loaded
              </p>
              {salesIssues.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-rose-300">
                  {salesIssues.slice(0, 5).map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}
            </label>

            <label className="block rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                <FileSpreadsheet className="h-4 w-4 text-sky-300" />
                Business notes CSV
              </div>
              <p className="mb-3 text-xs text-slate-400">
                Required: date, note. Optional: retailer, region, id
              </p>
              <input
                type="file"
                accept=".csv,text/csv"
                className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-slate-100"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onNotesFile(file);
                }}
              />
              <p className="mt-3 text-xs text-emerald-300">
                {notes.length} notes loaded
              </p>
              {notesIssues.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-rose-300">
                  {notesIssues.slice(0, 5).map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}
            </label>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="mb-2 text-sm font-medium text-slate-200">
              Or paste notes directly
            </p>
            <textarea
              value={pastedNotes}
              onChange={(e) => setPastedNotes(e.target.value)}
              placeholder="Paste retailer commentary, one note per line or CSV with date,note columns…"
              className="min-h-28 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-500/40 placeholder:text-slate-500 focus:ring-2"
            />
            <div className="mt-3">
              <Button type="button" variant="secondary" onClick={applyPastedNotes}>
                Apply pasted notes
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Live AI analysis failed</p>
                <p className="text-rose-200/90">{error}</p>
                <p className="mt-1 text-xs text-rose-200/70">
                  Configure GROQ_API_KEY in .env.local. Mock results are never
                  substituted silently.
                </p>
              </div>
            </div>
          )}

          <Button
            size="lg"
            disabled={!ready || loading}
            onClick={() => void analyze()}
          >
            {loading ? "Analyzing with Groq…" : "Analyze Signals"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
