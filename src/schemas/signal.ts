import { z } from "zod";

export const signalDirectionSchema = z.enum([
  "INCREASE",
  "DECREASE",
  "NEUTRAL",
  "UNKNOWN",
]);

export const signalCategorySchema = z.enum([
  "DEMAND_INCREASE",
  "DEMAND_DECREASE",
  "PROMOTION",
  "COMPETITOR_ACTIVITY",
  "SEASONALITY",
  "CUSTOMER_PREFERENCE",
  "SUPPLY_DISRUPTION",
  "UNKNOWN",
]);

export const extractedSignalSchema = z.object({
  sourceId: z.string(),
  sku: z.string().nullable(),
  productName: z.string().nullable(),
  retailer: z.string().nullable(),
  region: z.string().nullable(),
  category: signalCategorySchema,
  description: z.string().min(1),
  direction: signalDirectionSchema,
  confidence: z.coerce.number().min(0).max(1),
  potentialImpact: z.coerce.number().min(0).max(1),
  startDate: z.union([z.string(), z.null()]).catch(null),
  endDate: z.union([z.string(), z.null()]).catch(null),
  evidence: z.string().min(1),
  explanation: z.string().min(1),
});

export const extractedSignalsResponseSchema = z.object({
  signals: z.array(extractedSignalSchema),
});

export const salesRowSchema = z.object({
  date: z.string().min(1),
  sku: z.string().min(1),
  product_name: z.string().min(1),
  retailer: z.string().min(1),
  region: z.string().min(1),
  units_sold: z.coerce.number().finite(),
  revenue: z.coerce.number().finite(),
});

export const businessNoteSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  retailer: z.string().nullable(),
  region: z.string().nullable(),
  note: z.string().min(1),
});

export const analyzeRequestSchema = z
  .object({
    sales: z.array(salesRowSchema).max(5000),
    notes: z.array(businessNoteSchema).max(200).optional(),
    /** Skip AI and compose features from already-extracted semantic signals. */
    extractedSignals: z.array(extractedSignalSchema).max(500).optional(),
    demoMode: z.boolean().optional().default(false),
  })
  .superRefine((value, ctx) => {
    const noteCount = value.notes?.length ?? 0;
    const signalCount = value.extractedSignals?.length ?? 0;
    if (noteCount === 0 && signalCount === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Provide notes and/or extractedSignals",
        path: ["notes"],
      });
    }
  });

export const assistantRequestSchema = z.object({
  question: z.string().min(1).max(1000),
  signals: z.array(z.record(z.string(), z.unknown())).max(500),
  features: z.array(z.record(z.string(), z.unknown())).max(500),
  demoMode: z.boolean().optional().default(false),
});

export type ExtractedSignal = z.infer<typeof extractedSignalSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
