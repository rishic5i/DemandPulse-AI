"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { AnalysisResult, AppView, BusinessNote, SalesRow } from "@/types/domain";
import { parseNotesCsv, parsePastedNotes, parseSalesCsv } from "@/modules/ingestion/csv";

const STORAGE_KEY = "demandpulse_analysis_v1";
const listeners = new Set<() => void>();

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

export function useAnalysis() {
  const storedRaw = useSyncExternalStore(subscribe, getStoredRaw, () => null);
  const analysis = parseAnalysis(storedRaw);

  const [view, setView] = useState<AppView>("upload");
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
  }, []);

  const onSalesFile = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed = parseSalesCsv(text);
    setSales(parsed.data);
    setSalesIssues(parsed.issues.map((i) => `Row ${i.row}: ${i.message}`));
    setIngestIsDemo(false);
  }, []);

  const onNotesFile = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed = parseNotesCsv(text);
    setNotes(parsed.data);
    setNotesIssues(parsed.issues.map((i) => `Row ${i.row}: ${i.message}`));
    setIngestIsDemo(false);
  }, []);

  const applyPastedNotes = useCallback(() => {
    const parsed = parsePastedNotes(pastedNotes);
    setNotes(parsed);
    setNotesIssues(parsed.length === 0 ? ["No notes detected in pasted text"] : []);
    setIngestIsDemo(false);
  }, [pastedNotes]);

  const analyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sales,
          notes,
          demoMode: ingestIsDemo,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || "Analysis failed");
      }
      const result = payload.analysis as AnalysisResult;
      writeAnalysis(result);
      setHasChosenView(true);
      setView("overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, [sales, notes, ingestIsDemo]);

  const clearAnalysis = useCallback(() => {
    writeAnalysis(null);
    setHasChosenView(true);
    setView("upload");
  }, []);

  const onViewChange = useCallback((next: AppView) => {
    setHasChosenView(true);
    setView(next);
  }, []);

  const ready = sales.length > 0 && notes.length > 0;
  const demoMode = Boolean(analysis?.demoMode);
  const effectiveView =
    !hasChosenView && analysis && view === "upload" ? "overview" : view;

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
    analyze,
    loading,
    error,
    analysis,
    demoMode,
    ready,
    aiConfigured,
    clearAnalysis,
  };
}
