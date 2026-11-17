import type { AnalysisResult } from "@/types/domain";

/**
 * Best-effort in-memory store for warm serverless instances.
 * Does not persist across cold starts or multiple instances.
 */
const store = new Map<string, AnalysisResult>();

export function saveAnalysis(result: AnalysisResult): void {
  store.set(result.runId, result);
  if (store.size > 20) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
}

export function getAnalysis(runId: string): AnalysisResult | undefined {
  return store.get(runId);
}
