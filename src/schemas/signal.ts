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
  confidence: z.number().min(0).max(1),
  potentialImpact: z.number().min(0).max(1),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
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

export const analyzeRequestSchema = z.object({
  sales: z.array(salesRowSchema).max(5000),
  notes: z.array(businessNoteSchema).min(1).max(200),
  demoMode: z.boolean().optional().default(false),
});

export const assistantRequestSchema = z.object({
  question: z.string().min(1).max(1000),
  signals: z.array(z.record(z.string(), z.unknown())).max(500),
  features: z.array(z.record(z.string(), z.unknown())).max(500),
  demoMode: z.boolean().optional().default(false),
});

export type ExtractedSignal = z.infer<typeof extractedSignalSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
