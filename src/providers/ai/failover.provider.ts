import type { AiProvider } from "./ai-provider.interface";
import {
  AiProviderError,
  type AssistantInput,
  type AssistantResult,
  type ExtractSignalsInput,
  type ExtractSignalsResult,
} from "./ai.types";

function isFailoverWorthy(error: unknown): boolean {
  // Only known transport/quota failures. Unknown errors must surface, not hide behind a flaky secondary.
  if (!(error instanceof AiProviderError)) return false;
  return (
    error.code === "RATE_LIMITED" ||
    error.code === "PROVIDER_ERROR" ||
    error.code === "TIMEOUT" ||
    error.code === "QUOTA_EXCEEDED"
  );
}

/**
 * Tries the primary provider first; on transport/quota/invalid failures,
 * falls back to secondary when configured (never fabricates signals).
 */
export class FailoverAiProvider implements AiProvider {
  readonly name: string;
  readonly model: string;

  constructor(
    private readonly primary: AiProvider,
    private readonly secondary: AiProvider,
  ) {
    this.name = `${primary.name}+${secondary.name}`;
    this.model = primary.model;
  }

  isConfigured(): boolean {
    return this.primary.isConfigured() || this.secondary.isConfigured();
  }

  async extractSignals(
    input: ExtractSignalsInput,
  ): Promise<ExtractSignalsResult> {
    if (this.primary.isConfigured()) {
      try {
        return await this.primary.extractSignals(input);
      } catch (error) {
        if (!this.secondary.isConfigured() || !isFailoverWorthy(error)) {
          throw error;
        }
      }
    }

    if (!this.secondary.isConfigured()) {
      throw new AiProviderError(
        "No AI provider is configured.",
        "MISSING_API_KEY",
        503,
        false,
      );
    }

    return this.secondary.extractSignals(input);
  }

  async answerQuestion(input: AssistantInput): Promise<AssistantResult> {
    if (this.primary.isConfigured()) {
      try {
        return await this.primary.answerQuestion(input);
      } catch (error) {
        if (!this.secondary.isConfigured() || !isFailoverWorthy(error)) {
          throw error;
        }
      }
    }

    if (!this.secondary.isConfigured()) {
      throw new AiProviderError(
        "No AI provider is configured.",
        "MISSING_API_KEY",
        503,
        false,
      );
    }

    return this.secondary.answerQuestion(input);
  }
}
