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

function mapGroqError(error: unknown): AiProviderError {
  if (error instanceof AiProviderError) return error;

  const err = error as {
    status?: number;
    message?: string;
    error?: { message?: string };
  };
  const status = err.status;
  const message =
    err.error?.message || err.message || "Groq provider request failed";

  if (status === 429) {
    return new AiProviderError(
      "Groq rate limit exceeded. Wait briefly and retry.",
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
  if (typeof message === "string" && /quota|billing/i.test(message)) {
    return new AiProviderError(message, "QUOTA_EXCEEDED", status, false);
  }
  return new AiProviderError(message, "PROVIDER_ERROR", status, false);
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
      const mapped = mapGroqError(error);
      if (!mapped.retryable || i === attempts - 1) throw mapped;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw mapGroqError(lastError);
}

export class GroqProvider implements AiProvider {
  readonly name = "groq";
  readonly model: string;
  private client: Groq | null = null;

  constructor(model = process.env.GROQ_MODEL || "openai/gpt-oss-20b") {
    this.model = model;
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      this.client = new Groq({ apiKey, timeout: 60_000 });
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

  async extractSignals(
    input: ExtractSignalsInput,
  ): Promise<ExtractSignalsResult> {
    const client = this.getClient();
    const uniqueCatalog = Array.from(
      new Map(
        input.salesContext.map((row) => [
          `${row.sku}|${row.retailer}|${row.region}`,
          row,
        ]),
      ).values(),
    ).slice(0, 100);

    const batchSize = 8;
    const allSignals: ExtractSignalsResult["signals"] = [];
    let promptTokens = 0;
    let completionTokens = 0;

    for (let i = 0; i < input.notes.length; i += batchSize) {
      const batch = input.notes.slice(i, i + batchSize);
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
                catalogJson: JSON.stringify(uniqueCatalog, null, 2),
              }),
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "demand_signals",
              strict: true,
              schema: EXTRACTION_JSON_SCHEMA,
            },
          },
        }),
      );

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new AiProviderError(
          "Groq returned an empty extraction response.",
          "INVALID_RESPONSE",
        );
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(content);
      } catch {
        throw new AiProviderError(
          "Groq returned non-JSON content.",
          "INVALID_RESPONSE",
        );
      }

      const validated = extractedSignalsResponseSchema.safeParse(parsedJson);
      if (!validated.success) {
        throw new AiProviderError(
          "Groq response failed Zod validation.",
          "INVALID_RESPONSE",
          undefined,
          false,
        );
      }

      allSignals.push(...validated.data.signals);
      promptTokens += completion.usage?.prompt_tokens ?? 0;
      completionTokens += completion.usage?.completion_tokens ?? 0;
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
