import type { AiProvider } from "./ai-provider.interface";
import { GroqProvider } from "./groq.provider";

export function createAiProvider(): AiProvider {
  const provider = (process.env.AI_PROVIDER || "groq").toLowerCase();

  switch (provider) {
    case "groq":
      return new GroqProvider(process.env.GROQ_MODEL || "openai/gpt-oss-20b");
    default:
      throw new Error(
        `Unsupported AI_PROVIDER "${provider}". Supported: groq`,
      );
  }
}
