import type { AiProvider } from "./ai-provider.interface";
import { FailoverAiProvider } from "./failover.provider";
import { GroqProvider } from "./groq.provider";
import { OpenRouterProvider } from "./openrouter.provider";

/**
 * Prefer Groq for speed (demo path). OpenRouter is optional failover only.
 */
export function createAiProvider(): AiProvider {
  const provider = (process.env.AI_PROVIDER || "groq").toLowerCase();
  const failoverEnabled =
    (process.env.AI_FAILOVER || "true").toLowerCase() !== "false";

  const groq = process.env.GROQ_API_KEY
    ? new GroqProvider(process.env.GROQ_MODEL || "qwen/qwen3.8-27b")
    : null;
  const openrouter = process.env.OPENROUTER_API_KEY
    ? new OpenRouterProvider(process.env.OPENROUTER_MODEL || "openrouter/free")
    : null;

  switch (provider) {
    case "groq":
    case "auto": {
      if (!groq) {
        if (openrouter) return openrouter;
        throw new Error(
          "GROQ_API_KEY is required (or set OPENROUTER_API_KEY as fallback).",
        );
      }
      if (failoverEnabled && openrouter) {
        return new FailoverAiProvider(groq, openrouter);
      }
      return groq;
    }
    case "openrouter": {
      if (!openrouter) {
        throw new Error(
          "OPENROUTER_API_KEY is required when AI_PROVIDER=openrouter",
        );
      }
      if (failoverEnabled && groq) {
        return new FailoverAiProvider(openrouter, groq);
      }
      return openrouter;
    }
    default:
      throw new Error(
        `Unsupported AI_PROVIDER "${provider}". Supported: groq, auto, openrouter`,
      );
  }
}
