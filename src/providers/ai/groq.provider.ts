import Groq from "groq-sdk";
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

/** One request for the compact demo (~10 notes) keeps free-tier TPM under 8K. */
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_CONCURRENCY = 1;

function getErrorMessage(error: unknown): string {
  const err = error as {
    message?: string;
    error?: { message?: string; code?: string };
  };
  return err.error?.message || err.message || "Groq provider request failed";
}

function getErrorCode(error: unknown): string | undefined {
  const err = error as { error?: { code?: string }; code?: string };
  return err.error?.code || err.code;
}

function isJsonValidateFailure(error: unknown): boolean {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);
  return (
    code === "json_validate_failed" ||
    /Failed to validate JSON|json_validate_failed/i.test(message)
  );
}

function mapGroqError(error: unknown): AiProviderError {
  if (error instanceof AiProviderError) return error;

  const err = error as { status?: number };
  const status = err.status;
  const message = getErrorMessage(error);

  if (status === 429) {
    const retryHint = /try again in ([^.\s]+(?:\s[^.\s]+)?)/i.exec(message);
    const suffix = retryHint ? ` Try again in ${retryHint[1]}.` : " Wait briefly and retry.";
    return new AiProviderError(
      `Groq rate limit exceeded.${suffix}`,
      "RATE_LIMITED",
      429,
      true,
    );
  }
  if (status === 401 || status === 403) {
    return new AiProviderError(
      "Groq API key is missing or invalid.",
      "MISSING_API_KEY",
      status,
      false,
    );
  }
  if (isJsonValidateFailure(error)) {
    return new AiProviderError(
      "Groq structured output validation failed for this note batch. Retrying with a smaller batch.",
      "INVALID_RESPONSE",
      status ?? 400,
      true,
    );
  }
  if (typeof message === "string" && /quota|billing/i.test(message)) {
    return new AiProviderError(message, "QUOTA_EXCEEDED", status, false);
  }
  return new AiProviderError(message, "PROVIDER_ERROR", status, false);
}

async function withRetries<T>(
  fn: () => Promise<T>,
  attempts = 2,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const mapped = mapGroqError(error);
      if (!mapped.retryable || i === attempts - 1) throw mapped;
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  throw mapGroqError(lastError);
}

export class GroqProvider implements AiProvider {
  readonly name = "groq";
  readonly model: string;
  private client: Groq | null = null;

  constructor(model = process.env.GROQ_MODEL || "qwen/qwen3.8-27b") {
    this.model = model;
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      this.client = new Groq({ apiKey, timeout: 90_000 });
    }
  }

  isConfigured(): boolean {
    return Boolean(this.client && process.env.GROQ_API_KEY);
  }

  private getClient(): Groq {
    if (!this.client) {
      throw new AiProviderError(
        "GROQ_API_KEY is not configured. Add it to .env.local.",
        "MISSING_API_KEY",
        503,
        false,
      );
    }
    return this.client;
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
    const client = this.getClient();
    const completion = await withRetries(() =>
      client.chat.completions.create({
        model: this.model,
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
        response_format:
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

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new AiProviderError(
        "Groq returned an empty extraction response.",
        "INVALID_RESPONSE",
        undefined,
        true,
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(content);
    } catch {
      throw new AiProviderError(
        "Groq returned non-JSON content.",
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
        "Groq response failed Zod validation.",
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
    // Prefer json_object + Zod: strict schema payloads are large and burn free-tier TPM.
    try {
      return await this.extractBatch(batch, catalogJson, "json_object");
    } catch (error) {
      const mapped = mapGroqError(error);

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
          throw mapGroqError(fallbackError);
        }
      }

      throw mapped;
    }
  }

  async extractSignals(
    input: ExtractSignalsInput,
  ): Promise<ExtractSignalsResult> {
    // Compact catalog: one row per SKU keeps free-tier prompts small/fast.
    const uniqueCatalog = Array.from(
      new Map(input.salesContext.map((row) => [row.sku, row])).values(),
    ).slice(0, 8);

    const catalogJson = JSON.stringify(uniqueCatalog, null, 2);
    const batches: ExtractSignalsInput["notes"][] = [];
    for (let i = 0; i < input.notes.length; i += DEFAULT_BATCH_SIZE) {
      batches.push(input.notes.slice(i, i + DEFAULT_BATCH_SIZE));
    }

    const allSignals: ExtractSignalsResult["signals"] = [];
    let promptTokens = 0;
    let completionTokens = 0;

    for (let i = 0; i < batches.length; i += DEFAULT_CONCURRENCY) {
      const slice = batches.slice(i, i + DEFAULT_CONCURRENCY);
      const results = await Promise.all(
        slice.map((batch) => this.extractBatchWithFallback(batch, catalogJson)),
      );
      for (const extracted of results) {
        allSignals.push(...extracted.signals);
        promptTokens += extracted.promptTokens;
        completionTokens += extracted.completionTokens;
      }
    }

    return {
      signals: allSignals,
      model: this.model,
      provider: this.name,
      rawUsage: { promptTokens, completionTokens },
    };
  }

  async answerQuestion(input: AssistantInput): Promise<AssistantResult> {
    const client = this.getClient();
    const completion = await withRetries(() =>
      client.chat.completions.create({
        model: this.model,
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

    const answer = completion.choices[0]?.message?.content?.trim();
    if (!answer) {
      throw new AiProviderError(
        "Groq returned an empty assistant response.",
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
