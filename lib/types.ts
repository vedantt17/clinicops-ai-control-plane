export type WorkflowType =
  | "Eligibility verification"
  | "Prior authorization"
  | "Claim status"
  | "Appointment follow-up";

export type WorkflowStatus = "completed" | "human_review" | "dead_letter";

export type IntegrationChannel = "FHIR API" | "Payer API" | "Portal robot";

export interface FhirResource {
  resourceType: "Patient" | "Coverage" | "Claim" | "Task";
  id: string;
  identifier?: Array<{ system: string; value: string }>;
  status?: string;
  subject?: { reference: string };
  patient?: { reference: string };
  insurance?: Array<{ sequence: number; focal: boolean; coverage: { reference: string } }>;
  intent?: string;
  code?: { text: string };
}

export interface FhirBundle {
  resourceType: "Bundle";
  type: "collection";
  timestamp: string;
  entry: Array<{ fullUrl: string; resource: FhirResource }>;
}

export interface WorkflowRun {
  id: string;
  patientHash: string;
  site: string;
  workflow: WorkflowType;
  channel: IntegrationChannel;
  status: WorkflowStatus;
  attempts: number;
  latencyMs: number;
  modelCostUsd: number;
  manualMinutesAvoided: number;
  fallbackUsed: boolean;
  owner: string;
  reason: string;
  completedAt: string;
}

export interface MetricSummary {
  totalRuns: number;
  successRate: number;
  humanReviewRate: number;
  deadLetterRate: number;
  fallbackRate: number;
  p95LatencyMs: number;
  modeledHoursAvoided: number;
  totalModelCostUsd: number;
}

export interface RoadmapItem {
  id: string;
  title: string;
  workflow: WorkflowType;
  lane: "Now" | "Next" | "Later";
  impact: number;
  effort: number;
  monthlyVolume: number;
  minutesPerCase: number;
  modeledMonthlyHours: number;
  confidence: "High" | "Medium";
  control: string;
}

export interface VendorScore {
  vendor: string;
  approach: string;
  reliability: number;
  security: number;
  implementation: number;
  cost: number;
  weightedScore: number;
  recommendation: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  workflowRunId: string;
  patientHash: string;
  detail: string;
}

export interface SimulationSnapshot {
  generatedAt: string;
  seed: number;
  synthetic: true;
  fhirResourceCount: number;
  prohibitedFieldViolations: number;
  metrics: MetricSummary;
  runs: WorkflowRun[];
  roadmap: RoadmapItem[];
  vendors: VendorScore[];
  auditEvents: AuditEvent[];
}
