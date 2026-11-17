import type { BusinessNote, DemandSignal, SalesRow } from "@/types/domain";

export interface ExtractSignalsInput {
  notes: BusinessNote[];
  salesContext: Array<Pick<SalesRow, "sku" | "product_name" | "retailer" | "region">>;
}

export interface ExtractSignalsResult {
  signals: Omit<
    DemandSignal,
    "signalId" | "extractedAt" | "validationStatus" | "isSupplyRisk"
  >[];
  model: string;
  provider: string;
  rawUsage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
}

export interface AssistantInput {
  question: string;
  signalsSummary: string;
  featuresSummary: string;
}

export interface AssistantResult {
  answer: string;
  model: string;
  provider: string;
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "MISSING_API_KEY"
      | "RATE_LIMITED"
      | "QUOTA_EXCEEDED"
      | "INVALID_RESPONSE"
      | "TIMEOUT"
      | "PROVIDER_ERROR",
    public readonly status?: number,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}
