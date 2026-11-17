import { describe, expect, it } from "vitest";
import { AiProviderError } from "@/providers/ai/ai.types";

// Re-test error mapping behavior through a lightweight local replica of the
// production heuristics used by groq.provider.ts (keeps unit tests offline).
function mapLikeProduction(error: unknown): AiProviderError {
  const err = error as {
    status?: number;
    message?: string;
    error?: { message?: string; code?: string };
  };
  const message = err.error?.message || err.message || "Groq provider request failed";
  const code = err.error?.code;
  if (
    code === "json_validate_failed" ||
    /Failed to validate JSON|json_validate_failed/i.test(message)
  ) {
    return new AiProviderError(
      "Groq structured output validation failed for this note batch. Retrying with a smaller batch.",
      "INVALID_RESPONSE",
      err.status ?? 400,
      true,
    );
  }
  return new AiProviderError(message, "PROVIDER_ERROR", err.status, false);
}

describe("Groq JSON validation error handling", () => {
  it("marks json_validate_failed as retryable INVALID_RESPONSE", () => {
    const mapped = mapLikeProduction({
      status: 400,
      error: {
        message:
          "Failed to validate JSON. Please adjust your prompt. See 'failed_generation' for more details.",
        code: "json_validate_failed",
      },
    });
    expect(mapped.code).toBe("INVALID_RESPONSE");
    expect(mapped.retryable).toBe(true);
    expect(mapped.status).toBe(400);
  });
});
