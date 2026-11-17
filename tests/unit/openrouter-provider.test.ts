import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertFreeOpenRouterModel,
  isFreeOpenRouterModel,
  mapOpenRouterError,
  OpenRouterProvider,
} from "@/providers/ai/openrouter.provider";
import { createAiProvider } from "@/providers/ai/provider.factory";
import { AiProviderError } from "@/providers/ai/ai.types";

describe("OpenRouter free-model guard", () => {
  it("accepts openrouter/free and :free suffixes", () => {
    expect(isFreeOpenRouterModel("openrouter/free")).toBe(true);
    expect(isFreeOpenRouterModel("meta-llama/llama-3.2-3b-instruct:free")).toBe(
      true,
    );
    expect(isFreeOpenRouterModel("openai/gpt-4o")).toBe(false);
  });

  it("rejects paid model IDs", () => {
    expect(() => assertFreeOpenRouterModel("openai/gpt-4o")).toThrow(
      AiProviderError,
    );
  });
});

describe("mapOpenRouterError", () => {
  it("maps 429 to retryable RATE_LIMITED", () => {
    const mapped = mapOpenRouterError({ message: "Too many requests" }, 429);
    expect(mapped.code).toBe("RATE_LIMITED");
    expect(mapped.retryable).toBe(true);
    expect(mapped.status).toBe(429);
  });

  it("maps 402 to non-retryable QUOTA_EXCEEDED", () => {
    const mapped = mapOpenRouterError(
      { error: { message: "Payment required" } },
      402,
    );
    expect(mapped.code).toBe("QUOTA_EXCEEDED");
    expect(mapped.retryable).toBe(false);
  });

  it("maps 401 to MISSING_API_KEY", () => {
    const mapped = mapOpenRouterError({ message: "Unauthorized" }, 401);
    expect(mapped.code).toBe("MISSING_API_KEY");
  });

  it("marks schema/json failures as retryable INVALID_RESPONSE", () => {
    const mapped = mapOpenRouterError(
      { error: { message: "Failed to validate JSON schema" } },
      400,
    );
    expect(mapped.code).toBe("INVALID_RESPONSE");
    expect(mapped.retryable).toBe(true);
  });
});

describe("createAiProvider factory", () => {
  const originalProvider = process.env.AI_PROVIDER;
  const originalOrKey = process.env.OPENROUTER_API_KEY;
  const originalOrModel = process.env.OPENROUTER_MODEL;
  const originalGroqKey = process.env.GROQ_API_KEY;

  afterEach(() => {
    process.env.AI_PROVIDER = originalProvider;
    process.env.OPENROUTER_API_KEY = originalOrKey;
    process.env.OPENROUTER_MODEL = originalOrModel;
    process.env.GROQ_API_KEY = originalGroqKey;
  });

  it("creates OpenRouterProvider when AI_PROVIDER=openrouter", () => {
    process.env.AI_PROVIDER = "openrouter";
    process.env.OPENROUTER_API_KEY = "sk-or-test";
    process.env.OPENROUTER_MODEL = "openrouter/free";
    const provider = createAiProvider();
    expect(provider.name).toBe("openrouter");
    expect(provider.model).toBe("openrouter/free");
    expect(provider.isConfigured()).toBe(true);
  });

  it("rejects non-free OpenRouter models at construction", () => {
    expect(() => new OpenRouterProvider("openai/gpt-4o")).toThrow(
      /not free-tier/,
    );
  });
});

describe("OpenRouterProvider chat errors", () => {
  const originalKey = process.env.OPENROUTER_API_KEY;

  afterEach(() => {
    process.env.OPENROUTER_API_KEY = originalKey;
    vi.unstubAllGlobals();
  });

  it("surfaces rate-limit errors from fetch responses", async () => {
    process.env.OPENROUTER_API_KEY = "sk-or-test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: { message: "Rate limited" } }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const provider = new OpenRouterProvider("openrouter/free");
    await expect(
      provider.answerQuestion({
        question: "What is demand?",
        signalsSummary: "[]",
        featuresSummary: "[]",
      }),
    ).rejects.toMatchObject({
      code: "RATE_LIMITED",
      status: 429,
    });
  });
});
