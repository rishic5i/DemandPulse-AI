import { createRequestId, jsonError, jsonOk } from "@/lib/api-response";
import { saveAnalysis } from "@/lib/analysis-store";
import { createRunId } from "@/lib/utils";
import { generateFeatures } from "@/modules/features/generate";
import { validateAndNormalizeSignals } from "@/modules/intelligence/normalize";
import { createAiProvider } from "@/providers/ai/provider.factory";
import { AiProviderError } from "@/providers/ai/ai.types";
import { analyzeRequestSchema } from "@/schemas/signal";
import type { AnalysisResult } from "@/types/domain";

export const maxDuration = 300;

export async function POST(request: Request) {
  const requestId = createRequestId();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Request body must be JSON", requestId);
  }

  const parsed = analyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      400,
      "VALIDATION_ERROR",
      "Invalid analyze payload",
      requestId,
      parsed.error.flatten(),
    );
  }

  const { sales, notes, extractedSignals, demoMode } = parsed.data;
  if (sales.length === 0) {
    return jsonError(
      400,
      "VALIDATION_ERROR",
      "At least one sales row is required for entity grounding",
      requestId,
    );
  }

  try {
    let providerName = "compose";
    let modelName = "deterministic";
    let rawSignals = extractedSignals ?? [];

    if ((notes?.length ?? 0) > 0) {
      const provider = createAiProvider();
      const extracted = await provider.extractSignals({
        notes: notes!,
        salesContext: sales.map((row) => ({
          sku: row.sku,
          product_name: row.product_name,
          retailer: row.retailer,
          region: row.region,
        })),
      });
      rawSignals = [...rawSignals, ...extracted.signals];
      providerName = extracted.provider;
      modelName = extracted.model;
    }

    const signals = validateAndNormalizeSignals(rawSignals, sales);
    const features = generateFeatures(signals, sales);

    const result: AnalysisResult = {
      runId: createRunId(),
      createdAt: new Date().toISOString(),
      demoMode: Boolean(demoMode),
      salesRowCount: sales.length,
      noteCount: notes?.length ?? 0,
      signals,
      features,
      provider: providerName,
      model: modelName,
      warnings: [
        "Server storage is best-effort only. Keep this response client-side for dashboard/export use.",
        ...(signals.some((s) => s.validationStatus !== "VALID")
          ? [
              "Some signals have unresolved or partial entities. Invented entities were dropped.",
            ]
          : []),
      ],
    };

    saveAnalysis(result);

    return jsonOk({ analysis: result }, requestId);
  } catch (error) {
    if (error instanceof AiProviderError) {
      const status =
        error.code === "MISSING_API_KEY"
          ? 503
          : error.code === "RATE_LIMITED"
            ? 429
            : error.code === "INVALID_RESPONSE"
              ? 502
              : 502;
      // Prefer clean provider messages over raw nested JSON blobs.
      const message = error.message.replace(/^400\s+/, "").trim();
      return jsonError(status, error.code, message, requestId);
    }

    return jsonError(
      500,
      "INTERNAL_ERROR",
      "Analysis failed unexpectedly",
      requestId,
    );
  }
}
