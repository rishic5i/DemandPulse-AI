import { createRequestId, jsonError, jsonOk } from "@/lib/api-response";
import { createAiProvider } from "@/providers/ai/provider.factory";
import { AiProviderError } from "@/providers/ai/ai.types";
import { assistantRequestSchema } from "@/schemas/signal";

export async function POST(request: Request) {
  const requestId = createRequestId();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Request body must be JSON", requestId);
  }

  const parsed = assistantRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      400,
      "VALIDATION_ERROR",
      "Invalid assistant payload",
      requestId,
      parsed.error.flatten(),
    );
  }

  const { question, signals, features } = parsed.data;
  if (signals.length === 0 && features.length === 0) {
    return jsonError(
      400,
      "NO_CONTEXT",
      "No processed dataset provided. Analyze data first, then ask questions.",
      requestId,
    );
  }

  try {
    const provider = createAiProvider();
    const result = await provider.answerQuestion({
      question,
      signalsSummary: JSON.stringify(signals.slice(0, 40)),
      featuresSummary: JSON.stringify(features.slice(0, 40)),
    });

    return jsonOk(
      {
        answer: result.answer,
        provider: result.provider,
        model: result.model,
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof AiProviderError) {
      const status =
        error.code === "MISSING_API_KEY"
          ? 503
          : error.code === "RATE_LIMITED"
            ? 429
            : 502;
      return jsonError(status, error.code, error.message, requestId);
    }
    return jsonError(
      500,
      "INTERNAL_ERROR",
      "Assistant request failed",
      requestId,
    );
  }
}
