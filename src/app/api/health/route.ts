import { createRequestId, jsonOk } from "@/lib/api-response";
import { createAiProvider } from "@/providers/ai/provider.factory";

export async function GET() {
  const requestId = createRequestId();
  let providerName = process.env.AI_PROVIDER || "groq";
  let model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  let configured = false;

  try {
    const provider = createAiProvider();
    providerName = provider.name;
    model = provider.model;
    configured = provider.isConfigured();
  } catch {
    configured = false;
  }

  return jsonOk(
    {
      status: "ok",
      service: "DemandPulse AI",
      timestamp: new Date().toISOString(),
      ai: {
        provider: providerName,
        model,
        configured,
        // Never expose secrets
      },
      storage: {
        mode: "stateless",
        note: "Analysis results are returned in API responses and held client-side. Server memory is best-effort only.",
      },
    },
    requestId,
  );
}
