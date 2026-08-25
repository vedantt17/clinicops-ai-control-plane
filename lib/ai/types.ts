import type { WorkflowType } from "@/lib/types";

export type AgentVersion = "baseline-v1" | "guardrailed-v2";
export type AgentAction = "complete" | "human_review" | "dead_letter";
export type RiskLevel = "low" | "medium" | "high";

export interface EvaluationCase {
  id: string;
  title: string;
  workflow: WorkflowType;
  risk: RiskLevel;
  input: string;
  expectedAction: AgentAction;
  evidence: string[];
  adversarial?: boolean;
}

export interface ToolTrace {
  step: number;
  tool: string;
  status: "passed" | "blocked" | "completed";
  detail: string;
  durationMs: number;
}

export interface ModelRequest {
  case: EvaluationCase;
  version: AgentVersion;
  systemPrompt: string;
}

export interface ModelResponse {
  action: AgentAction;
  confidence: number;
  rationale: string;
  citations: string[];
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  estimatedCostUsd: number;
  trace: ToolTrace[];
  policyGate: string;
}

export interface ModelAdapter {
  readonly name: string;
  readonly mode: "replay" | "live";
  generate(request: ModelRequest): Promise<ModelResponse>;
}

export interface EvaluationResult extends ModelResponse {
  caseId: string;
  title: string;
  workflow: WorkflowType;
  risk: RiskLevel;
  expectedAction: AgentAction;
  passed: boolean;
  adversarial: boolean;
}

export interface EvaluationMetrics {
  decisionAccuracy: number;
  escalationPrecision: number;
  unsafeAutoActionRate: number;
  calibrationError: number;
  p95LatencyMs: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface EvaluationReport {
  version: AgentVersion;
  label: string;
  adapter: string;
  mode: "replay" | "live";
  promptVersion: string;
  generatedAt: string;
  metrics: EvaluationMetrics;
  results: EvaluationResult[];
}
