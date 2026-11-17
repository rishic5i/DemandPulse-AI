export type SignalDirection = "INCREASE" | "DECREASE" | "NEUTRAL" | "UNKNOWN";

export type SignalCategory =
  | "DEMAND_INCREASE"
  | "DEMAND_DECREASE"
  | "PROMOTION"
  | "COMPETITOR_ACTIVITY"
  | "SEASONALITY"
  | "CUSTOMER_PREFERENCE"
  | "SUPPLY_DISRUPTION"
  | "UNKNOWN";

export type ValidationStatus = "VALID" | "PARTIAL" | "UNRESOLVED_ENTITIES";

export interface SalesRow {
  date: string;
  sku: string;
  product_name: string;
  retailer: string;
  region: string;
  units_sold: number;
  revenue: number;
}

export interface BusinessNote {
  id: string;
  date: string;
  retailer: string | null;
  region: string | null;
  note: string;
}

export interface DemandSignal {
  signalId: string;
  sourceId: string;
  sku: string | null;
  productName: string | null;
  retailer: string | null;
  region: string | null;
  category: SignalCategory;
  description: string;
  direction: SignalDirection;
  confidence: number;
  potentialImpact: number;
  startDate: string | null;
  endDate: string | null;
  evidence: string;
  explanation: string;
  extractedAt: string;
  validationStatus: ValidationStatus;
  isSupplyRisk: boolean;
}

export interface FeatureRecord {
  sku: string;
  retailer: string;
  region: string;
  forecastWindow: string;
  asOf: string;
  demand_signal_count: number | null;
  demand_up_count: number | null;
  demand_down_count: number | null;
  net_demand_signal: number | null;
  promotion_active: number | null;
  promotion_store_count: number | null;
  competitor_pressure_score: number | null;
  customer_interest_score: number | null;
  seasonal_signal_score: number | null;
  supply_disruption_score: number | null;
  stockout_risk_indicator: number | null;
  signal_confidence: number | null;
  feature_freshness_hours: number | null;
  sourceSignalIds: string[];
}

export interface AnalysisResult {
  runId: string;
  createdAt: string;
  demoMode: boolean;
  salesRowCount: number;
  noteCount: number;
  signals: DemandSignal[];
  features: FeatureRecord[];
  salesSnapshot?: SalesRow[];
  provider: string;
  model: string;
  warnings: string[];
}

export type AppView =
  | "home"
  | "overview"
  | "signals"
  | "features"
  | "copilot"
  | "upload";
