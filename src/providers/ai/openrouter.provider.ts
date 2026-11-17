import { extractedSignalsResponseSchema } from "@/schemas/signal";
import type { AiProvider } from "./ai-provider.interface";
import {
  AiProviderError,
  type AssistantInput,
  type AssistantResult,
  type ExtractSignalsInput,
  type ExtractSignalsResult,
} from "./ai.types";
import {
  ASSISTANT_SYSTEM_PROMPT,
  SIGNAL_EXTRACTION_SYSTEM_PROMPT,
  buildExtractionUserPrompt,
} from "@/modules/intelligence/prompts";
import { sanitizeExtractedSignalsPayload } from "@/modules/intelligence/sanitize-extraction";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_FREE_MODEL = "openrouter/free";

/** Free-model batches stay small; Zod validates json_object output. */
const DEFAULT_BATCH_SIZE = 3;
/** 20 RPM free-tier; 2 keeps latency down without bursting free endpoints. */
const DEFAULT_CONCURRENCY = 2;
const REQUEST_TIMEOUT_MS = 75_000;

const EXTRACTION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["signals"],
  properties: {
    signals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "sourceId",
          "sku",
          "productName",
          "retailer",
          "region",
          "category",
          "description",
          "direction",
          "confidence",
          "potentialImpact",
          "startDate",
          "endDate",
          "evidence",
          "explanation",
        ],
        properties: {
          sourceId: { type: "string" },
          sku: { type: ["string", "null"] },
          productName: { type: ["string", "null"] },
          retailer: { type: ["string", "null"] },
          region: { type: ["string", "null"] },
          category: {
            type: "string",
            enum: [
              "DEMAND_INCREASE",
              "DEMAND_DECREASE",
              "PROMOTION",
              "COMPETITOR_ACTIVITY",
              "SEASONALITY",
              "CUSTOMER_PREFERENCE",
              "SUPPLY_DISRUPTION",
              "UNKNOWN",
            ],
          },
          description: { type: "string" },
          direction: {
            type: "string",
            enum: ["INCREASE", "DECREASE", "NEUTRAL", "UNKNOWN"],
          },
          confidence: { type: "number" },
          potentialImpact: { type: "number" },
          startDate: { type: ["string", "null"] },
          endDate: { type: ["string", "null"] },
          evidence: { type: "string" },
          explanation: { type: "string" },
        },
      },
    },
  },
} as const;

export function isFreeOpenRouterModel(model: string): boolean {
  return model === "openrouter/free" || model.endsWith(":free");
}

export function assertFreeOpenRouterModel(model: string): void {
  if (!isFreeOpenRouterModel(model)) {
    throw new AiProviderError(
      `OpenRouter model "${model}" is not free-tier. Use openrouter/free or a model ending in :free.`,
      "PROVIDER_ERROR",
      400,
      false,
    );
  }
}

type OpenRouterErrorBody = {
  error?: {
    message?: string;
    code?: string | number;
    metadata?: Record<string, unknown>;
  };
  message?: string;
};

export function mapOpenRouterError(
  error: unknown,
  status?: number,
): AiProviderError {
  if (error instanceof AiProviderError) return error;

  const err = error as OpenRouterErrorBody & {
    status?: number;
    message?: string;
  };
  const httpStatus = status ?? err.status;
  const message =
    err.error?.message || err.message || "OpenRouter provider request failed";

  if (httpStatus === 429) {
    return new AiProviderError(
      "OpenRouter free-tier rate limit exceeded (20 RPM / 50 RPD without credits). Wait and retry, or switch AI_PROVIDER=groq.",
      "RATE_LIMITED",
      429,
      true,
    );
  }
  if (httpStatus === 401 || httpStatus === 403) {
    return new AiProviderError(
      "OpenRouter API key is missing or invalid.",
      "MISSING_API_KEY",
      httpStatus,
      false,
    );
  }
  if (httpStatus === 402) {
    return new AiProviderError(
      "OpenRouter rejected the request (payment required). Use only free models (openrouter/free or *:free) — paid fallbacks are disabled.",
      "QUOTA_EXCEEDED",
      402,
      false,
    );
  }
  if (/json|schema|parse|validate/i.test(message)) {
    return new AiProviderError(
      "OpenRouter structured output validation failed for this note batch. Retrying with a smaller batch.",
      "INVALID_RESPONSE",
      httpStatus ?? 400,
      true,
    );
  }
  if (/quota|billing|credit/i.test(message)) {
    return new AiProviderError(message, "QUOTA_EXCEEDED", httpStatus, false);
  }
  return new AiProviderError(message, "PROVIDER_ERROR", httpStatus, false);
}

function mapFetchFailure(error: unknown): AiProviderError {
  if (error instanceof AiProviderError) return error;
  const err = error as { name?: string; message?: string };
  if (
    err.name === "TimeoutError" ||
    err.name === "AbortError" ||
    /aborted|timeout/i.test(err.message || "")
  ) {
    return new AiProviderError(
      "OpenRouter request timed out.",
      "TIMEOUT",
      504,
      true,
    );
  }
  return mapOpenRouterError(error);
}

async function withRetries<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const mapped = mapFetchFailure(error);
      if (!mapped.retryable || i === attempts - 1) throw mapped;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw mapFetchFailure(lastError);
}

function parseJsonContent(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw);
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function run(): Promise<void> {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index]);
    }
  }

  const runners = Array.from(
    { length: Math.min(concurrency, Math.max(items.length, 1)) },
    () => run(),
  );
  await Promise.all(runners);
  return results;
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  error?: OpenRouterErrorBody["error"];
};

export class OpenRouterProvider implements AiProvider {
  readonly name = "openrouter";
  readonly model: string;
  private readonly apiKey: string | null;

  constructor(model = process.env.OPENROUTER_MODEL || DEFAULT_FREE_MODEL) {
    assertFreeOpenRouterModel(model);
    this.model = model;
    this.apiKey = process.env.OPENROUTER_API_KEY || null;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  private getApiKey(): string {
    if (!this.apiKey) {
      throw new AiProviderError(
        "OPENROUTER_API_KEY is not configured. Add it to .env.local.",
        "MISSING_API_KEY",
        503,
        false,
      );
    }
    return this.apiKey;
  }

  private async chatCompletion(params: {
    messages: ChatMessage[];
    temperature: number;
    responseFormat?:
      | { type: "json_schema"; json_schema: Record<string, unknown> }
      | { type: "json_object" };
  }): Promise<ChatCompletionResponse> {
    const apiKey = this.getApiKey();
    const body: Record<string, unknown> = {
      model: this.model,
      temperature: params.temperature,
      messages: params.messages,
    };
    if (params.responseFormat) {
      body.response_format = params.responseFormat;
    }

    let response: Response;
    try {
      response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.OPENROUTER_HTTP_REFERER ||
            "https://demandpulse-ai.vercel.app",
          "X-Title": process.env.OPENROUTER_APP_TITLE || "DemandPulse AI",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw mapFetchFailure(error);
    }

    const rawText = await response.text();
    let payload: ChatCompletionResponse & OpenRouterErrorBody = {};
    if (rawText.trim()) {
      try {
        payload = JSON.parse(rawText) as ChatCompletionResponse &
          OpenRouterErrorBody;
      } catch {
        // Upstream gateways sometimes return HTML/empty bodies — retry.
        throw new AiProviderError(
          "OpenRouter returned a non-JSON error body.",
          "PROVIDER_ERROR",
          response.status || 502,
          true,
        );
      }
    } else if (!response.ok) {
      throw new AiProviderError(
        "OpenRouter returned an empty error body.",
        "PROVIDER_ERROR",
        response.status,
        true,
      );
    }

    if (!response.ok) {
      throw mapOpenRouterError(
        {
          status: response.status,
          message: payload.error?.message || payload.message,
          error: payload.error,
        },
        response.status,
      );
    }

    return payload;
  }

  private async extractBatch(
    batch: ExtractSignalsInput["notes"],
    catalogJson: string,
    mode: "strict" | "json_object",
  ): Promise<{
    signals: ExtractSignalsResult["signals"];
    promptTokens: number;
    completionTokens: number;
  }> {
    const completion = await withRetries(() =>
      this.chatCompletion({
        temperature: 0.1,
        messages: [
          { role: "system", content: SIGNAL_EXTRACTION_SYSTEM_PROMPT },
          {
            role: "user",
            content: buildExtractionUserPrompt({
              notesJson: JSON.stringify(batch, null, 2),
              catalogJson,
            }),
          },
        ],
        responseFormat:
          mode === "strict"
            ? {
                type: "json_schema",
                json_schema: {
                  name: "demand_signals",
                  strict: true,
                  schema: EXTRACTION_JSON_SCHEMA,
                },
              }
            : { type: "json_object" },
      }),
    );

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      throw new AiProviderError(
        "OpenRouter returned an empty extraction response.",
        "INVALID_RESPONSE",
        undefined,
        true,
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = parseJsonContent(content);
    } catch {
      throw new AiProviderError(
        "OpenRouter returned non-JSON content.",
        "INVALID_RESPONSE",
        undefined,
        true,
      );
    }

    const validated = extractedSignalsResponseSchema.safeParse(
      sanitizeExtractedSignalsPayload(parsedJson),
    );
    if (!validated.success) {
      throw new AiProviderError(
        "OpenRouter response failed Zod validation.",
        "INVALID_RESPONSE",
        undefined,
        true,
      );
    }

    return {
      signals: validated.data.signals,
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
    };
  }

  private async extractBatchWithFallback(
    batch: ExtractSignalsInput["notes"],
    catalogJson: string,
  ): Promise<{
    signals: ExtractSignalsResult["signals"];
    promptTokens: number;
    completionTokens: number;
  }> {
    // Free models: prefer json_object + Zod first (strict schema often flakes).
    try {
      return await this.extractBatch(batch, catalogJson, "json_object");
    } catch (error) {
      const mapped = mapFetchFailure(error);

      if (
        mapped.code === "INVALID_RESPONSE" &&
        batch.length > 1 &&
        mapped.retryable
      ) {
        const mid = Math.ceil(batch.length / 2);
        const left = await this.extractBatchWithFallback(
          batch.slice(0, mid),
          catalogJson,
        );
        const right = await this.extractBatchWithFallback(
          batch.slice(mid),
          catalogJson,
        );
        return {
          signals: [...left.signals, ...right.signals],
          promptTokens: left.promptTokens + right.promptTokens,
          completionTokens: left.completionTokens + right.completionTokens,
        };
      }

      if (batch.length === 1 && mapped.code === "INVALID_RESPONSE") {
        try {
          return await this.extractBatch(batch, catalogJson, "strict");
        } catch (fallbackError) {
          throw mapFetchFailure(fallbackError);
        }
      }

      throw mapped;
    }
  }

  async extractSignals(
    input: ExtractSignalsInput,
  ): Promise<ExtractSignalsResult> {
    const uniqueCatalog = Array.from(
      new Map(input.salesContext.map((row) => [row.sku, row])).values(),
    ).slice(0, 8);

    const catalogJson = JSON.stringify(uniqueCatalog, null, 2);
    const batches: ExtractSignalsInput["notes"][] = [];
    for (let i = 0; i < input.notes.length; i += DEFAULT_BATCH_SIZE) {
      batches.push(input.notes.slice(i, i + DEFAULT_BATCH_SIZE));
    }

    const extractedBatches = await mapPool(
      batches,
      DEFAULT_CONCURRENCY,
      (batch) => this.extractBatchWithFallback(batch, catalogJson),
    );

    const allSignals: ExtractSignalsResult["signals"] = [];
    let promptTokens = 0;
    let completionTokens = 0;
    for (const extracted of extractedBatches) {
      allSignals.push(...extracted.signals);
      promptTokens += extracted.promptTokens;
      completionTokens += extracted.completionTokens;
    }

    return {
      signals: allSignals,
      model: this.model,
      provider: this.name,
      rawUsage: { promptTokens, completionTokens },
    };
  }

  async answerQuestion(input: AssistantInput): Promise<AssistantResult> {
    const completion = await withRetries(() =>
      this.chatCompletion({
        temperature: 0.2,
        messages: [
          { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Signals:\n${input.signalsSummary}\n\nFeatures:\n${input.featuresSummary}\n\nQuestion: ${input.question}`,
          },
        ],
      }),
    );

    const answer = completion.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      throw new AiProviderError(
        "OpenRouter returned an empty assistant response.",
        "INVALID_RESPONSE",
      );
    }

    return {
      answer,
      model: this.model,
      provider: this.name,
    };
  }
}
