import type { AiProvider } from "./ai-provider.interface";
import { GroqProvider } from "./groq.provider";
import { OpenRouterProvider } from "./openrouter.provider";

export function createAiProvider(): AiProvider {
  const provider = (process.env.AI_PROVIDER || "groq").toLowerCase();

  switch (provider) {
    case "groq":
      return new GroqProvider(process.env.GROQ_MODEL || "openai/gpt-oss-20b");
    case "openrouter":
      return new OpenRouterProvider(
        process.env.OPENROUTER_MODEL || "openrouter/free",
      );
    default:
      throw new Error(
        `Unsupported AI_PROVIDER "${provider}". Supported: groq, openrouter`,
      );
  }
}
