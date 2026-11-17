"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { AnalysisResult, AppView, BusinessNote, SalesRow } from "@/types/domain";
import { parseNotesCsv, parsePastedNotes, parseSalesCsv } from "@/modules/ingestion/csv";

const STORAGE_KEY = "demandpulse_analysis_v1";
const listeners = new Set<() => void>();

export type PipelineStage =
  | "idle"
  | "loading_demo"
  | "ready"
  | "extracting"
  | "complete"
  | "error";

function emitStorage() {
  listeners.forEach((listener) => listener());
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getStoredRaw(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeAnalysis(result: AnalysisResult | null) {
  try {
    if (result) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore quota/private mode failures
  }
  emitStorage();
}

function parseAnalysis(raw: string | null): AnalysisResult | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    return null;
  }
}

async function runAnalyzeRequest(
  sales: SalesRow[],
  notes: BusinessNote[],
  demoMode: boolean,
): Promise<AnalysisResult> {
  // Demo dataset is sized for one Groq call path — keep the UI path simple and fast.
  let lastMessage = "Analysis failed";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sales, notes, demoMode }),
    });
    const payload = await response.json();
    if (response.ok) {
      return payload.analysis as AnalysisResult;
    }
    lastMessage = payload?.error?.message || "Analysis failed";
    if (response.status !== 429 || attempt === 1) break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(lastMessage);
}

export function useAnalysis() {
  const storedRaw = useSyncExternalStore(subscribe, getStoredRaw, () => null);
  const analysis = parseAnalysis(storedRaw);

  const [view, setView] = useState<AppView>("home");
  const [sales, setSales] = useState<SalesRow[]>([]);
  const [notes, setNotes] = useState<BusinessNote[]>([]);
  const [salesIssues, setSalesIssues] = useState<string[]>([]);
  const [notesIssues, setNotesIssues] = useState<string[]>([]);
  const [pastedNotes, setPastedNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [hasChosenView, setHasChosenView] = useState(false);
  const [ingestIsDemo, setIngestIsDemo] = useState(false);
  const [stage, setStage] = useState<PipelineStage>(
    analysis ? "complete" : "idle",
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setAiConfigured(Boolean(data.ai?.configured));
      })
      .catch(() => {
        if (!cancelled) setAiConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadDemo = useCallback(async () => {
    setError(null);
    setStage("loading_demo");
    const [salesRes, notesRes] = await Promise.all([
      fetch("/demo/sales.csv").then((r) => r.text()),
      fetch("/demo/business-notes.csv").then((r) => r.text()),
    ]);
    const salesParsed = parseSalesCsv(salesRes);
    const notesParsed = parseNotesCsv(notesRes);
    setSales(salesParsed.data);
    setNotes(notesParsed.data);
    setSalesIssues(salesParsed.issues.map((i) => `Row ${i.row}: ${i.message}`));
    setNotesIssues(notesParsed.issues.map((i) => `Row ${i.row}: ${i.message}`));
    setPastedNotes("");
    setIngestIsDemo(true);
    setStage("ready");
    return {
      sales: salesParsed.data,
      notes: notesParsed.data,
    };
  }, []);

  const onSalesFile = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed = parseSalesCsv(text);
    setSales(parsed.data);
    setSalesIssues(parsed.issues.map((i) => `Row ${i.row}: ${i.message}`));
    setIngestIsDemo(false);
    setStage(parsed.data.length > 0 && notes.length > 0 ? "ready" : "idle");
  }, [notes.length]);

  const onNotesFile = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed = parseNotesCsv(text);
    setNotes(parsed.data);
    setNotesIssues(parsed.issues.map((i) => `Row ${i.row}: ${i.message}`));
    setIngestIsDemo(false);
    setStage(sales.length > 0 && parsed.data.length > 0 ? "ready" : "idle");
  }, [sales.length]);

  const applyPastedNotes = useCallback(() => {
    const parsed = parsePastedNotes(pastedNotes);
    setNotes(parsed);
    setNotesIssues(parsed.length === 0 ? ["No notes detected in pasted text"] : []);
    setIngestIsDemo(false);
    setStage(sales.length > 0 && parsed.length > 0 ? "ready" : "idle");
  }, [pastedNotes, sales.length]);

  const analyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStage("extracting");
    try {
      const result = await runAnalyzeRequest(sales, notes, ingestIsDemo);
      writeAnalysis({ ...result, salesSnapshot: sales });
      setHasChosenView(true);
      setView("overview");
      setStage("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStage("error");
    } finally {
      setLoading(false);
    }
  }, [sales, notes, ingestIsDemo]);

  const runFullDemo = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStage("loading_demo");
    try {
      const demo = await loadDemo();
      setStage("extracting");
      const result = await runAnalyzeRequest(demo.sales, demo.notes, true);
      writeAnalysis({ ...result, salesSnapshot: demo.sales });
      setHasChosenView(true);
      setView("overview");
      setStage("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo analysis failed");
      setStage("error");
    } finally {
      setLoading(false);
    }
  }, [loadDemo]);

  const clearAnalysis = useCallback(() => {
    writeAnalysis(null);
    setHasChosenView(true);
    setView("home");
    setStage(sales.length > 0 && notes.length > 0 ? "ready" : "idle");
  }, [sales.length, notes.length]);

  const onViewChange = useCallback((next: AppView) => {
    setHasChosenView(true);
    setView(next);
  }, []);

  const ready = sales.length > 0 && notes.length > 0;
  const demoMode = Boolean(analysis?.demoMode);
  const effectiveView =
    !hasChosenView && analysis && (view === "upload" || view === "home")
      ? "overview"
      : view;
  const effectiveStage = analysis && stage === "idle" ? "complete" : stage;

  return {
    view: effectiveView,
    setView: onViewChange,
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
    analysis,
    demoMode,
    ready,
    aiConfigured,
    clearAnalysis,
    stage: effectiveStage,
  };
}
