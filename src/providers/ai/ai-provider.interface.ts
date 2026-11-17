import type {
  AssistantInput,
  AssistantResult,
  ExtractSignalsInput,
  ExtractSignalsResult,
} from "./ai.types";

export interface AiProvider {
  readonly name: string;
  readonly model: string;
  isConfigured(): boolean;
  extractSignals(input: ExtractSignalsInput): Promise<ExtractSignalsResult>;
  answerQuestion(input: AssistantInput): Promise<AssistantResult>;
}
