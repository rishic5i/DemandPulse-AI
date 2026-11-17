import { createRequestId, jsonError, jsonOk } from "@/lib/api-response";
import { getAnalysis } from "@/lib/analysis-store";
import { filterFeatures } from "@/modules/features/generate";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");
  const sku = searchParams.get("sku");
  const retailer = searchParams.get("retailer");
  const region = searchParams.get("region");

  if (!runId) {
    return jsonError(
      400,
      "MISSING_RUN_ID",
      "Provide runId from /api/analyze. This deployment is stateless; cold starts may lose in-memory runs. Prefer using the analyze response payload.",
      requestId,
      {
        example: "/api/features?runId=run_xxx&sku=SKU001",
        storage: "best-effort in-memory only",
      },
    );
  }

  const analysis = getAnalysis(runId);
  if (!analysis) {
    return jsonError(
      404,
      "RUN_NOT_FOUND",
      "No in-memory analysis found for this runId. Re-run /api/analyze and use the returned features, or keep the payload client-side.",
      requestId,
    );
  }

  const features = filterFeatures(analysis.features, { sku, retailer, region });

  return jsonOk(
    {
      runId,
      count: features.length,
      features,
      storage: "best-effort",
    },
    requestId,
  );
}
