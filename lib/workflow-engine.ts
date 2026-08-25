import { createHash } from "node:crypto";
import { buildSyntheticFhirBundle, findProhibitedFields } from "./fhir-fixtures";
import type {
  AuditEvent,
  IntegrationChannel,
  RoadmapItem,
  SimulationSnapshot,
  VendorScore,
  WorkflowRun,
  WorkflowStatus,
  WorkflowType,
} from "./types";

const SITES = ["Northside MSK", "Hudson Ortho", "Union Sports Medicine"];
const WORKFLOWS: WorkflowType[] = [
  "Eligibility verification",
  "Prior authorization",
  "Claim status",
  "Appointment follow-up",
];
const CHANNELS: IntegrationChannel[] = ["FHIR API", "Payer API", "Portal robot"];
const OWNERS = ["Revenue Operations", "Clinical Operations", "Integration Engineering"];

function hashPatient(value: string): string {
  return createHash("sha256").update(`clinicops-public-salt:${value}`).digest("hex").slice(0, 12);
}

function percentile(values: number[], percentileValue: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

function runStatus(index: number): WorkflowStatus {
  if (index % 17 === 0) return "dead_letter";
  if (index % 11 === 0) return "human_review";
  return "completed";
}

function reasonFor(status: WorkflowStatus, fallbackUsed: boolean): string {
  if (status === "dead_letter") return "Upstream portal unavailable after retry budget";
  if (status === "human_review") return "Coverage evidence conflicts with payer response";
  if (fallbackUsed) return "API timeout recovered through portal fallback";
  return "Completed within policy";
}

function generateRuns(seed: number): WorkflowRun[] {
  return Array.from({ length: 240 }, (_, offset) => {
    const index = offset + 1;
    const status = runStatus(index + seed);
    const fallbackUsed = (index + seed) % 7 === 0;
    const workflow = WORKFLOWS[(index + seed) % WORKFLOWS.length];
    const channel = fallbackUsed ? "Portal robot" : CHANNELS[(index + seed * 2) % 2];
    const patientId = `pt-${(((index - 1) % 60) + 1).toString().padStart(3, "0")}`;
    const attempts = 1 + Number(fallbackUsed) + Number(status === "dead_letter");
    return {
      id: `run-${seed}-${index.toString().padStart(3, "0")}`,
      patientHash: hashPatient(patientId),
      site: SITES[(index + seed) % SITES.length],
      workflow,
      channel,
      status,
      attempts,
      latencyMs: 420 + ((index * 73 + seed * 41) % 4_100),
      modelCostUsd: Number((0.009 + ((index + seed) % 9) * 0.0025).toFixed(4)),
      manualMinutesAvoided: status === "completed" ? 7 + ((index + seed) % 13) : status === "human_review" ? 3 : 0,
      fallbackUsed,
      owner: OWNERS[(index + seed) % OWNERS.length],
      reason: reasonFor(status, fallbackUsed),
      completedAt: new Date(Date.UTC(2026, 7, 25, 12, 0, index)).toISOString(),
    };
  });
}

function buildRoadmap(): RoadmapItem[] {
  const items: Omit<RoadmapItem, "modeledMonthlyHours">[] = [
    { id: "opp-1", title: "Automate eligibility verification", workflow: "Eligibility verification", lane: "Now", impact: 5, effort: 2, monthlyVolume: 2_800, minutesPerCase: 9, confidence: "High", control: "Human review on conflicting coverage" },
    { id: "opp-2", title: "Prior-auth evidence assistant", workflow: "Prior authorization", lane: "Now", impact: 5, effort: 4, monthlyVolume: 1_100, minutesPerCase: 18, confidence: "Medium", control: "Abstain when clinical evidence is absent" },
    { id: "opp-3", title: "Claim-status API polling", workflow: "Claim status", lane: "Next", impact: 4, effort: 2, monthlyVolume: 3_600, minutesPerCase: 6, confidence: "High", control: "Dead-letter after retry budget" },
    { id: "opp-4", title: "Appointment follow-up routing", workflow: "Appointment follow-up", lane: "Next", impact: 3, effort: 2, monthlyVolume: 1_900, minutesPerCase: 5, confidence: "High", control: "Opt-out and channel policy checks" },
    { id: "opp-5", title: "Cross-EHR referral reconciliation", workflow: "Appointment follow-up", lane: "Later", impact: 5, effort: 5, monthlyVolume: 780, minutesPerCase: 22, confidence: "Medium", control: "Reconcile against source-of-record" },
    { id: "opp-6", title: "Denial root-cause summarization", workflow: "Claim status", lane: "Later", impact: 4, effort: 4, monthlyVolume: 950, minutesPerCase: 14, confidence: "Medium", control: "Citation and supervisor approval" },
  ];
  return items.map((item) => ({
    ...item,
    modeledMonthlyHours: Number(((item.monthlyVolume * item.minutesPerCase) / 60).toFixed(1)),
  }));
}

function buildVendors(): VendorScore[] {
  const raw = [
    { vendor: "Direct FHIR adapter", approach: "API-first", reliability: 94, security: 96, implementation: 73, cost: 88, recommendation: "Preferred for supported EHR workflows" },
    { vendor: "Portal robot", approach: "Browser fallback", reliability: 79, security: 72, implementation: 91, cost: 65, recommendation: "Use only for last-mile coverage" },
    { vendor: "Managed integration", approach: "External platform", reliability: 91, security: 92, implementation: 84, cost: 62, recommendation: "Evaluate for high-volume expansion" },
  ];
  return raw.map((vendor) => ({
    ...vendor,
    weightedScore: Number((vendor.reliability * 0.35 + vendor.security * 0.3 + vendor.implementation * 0.2 + vendor.cost * 0.15).toFixed(1)),
  }));
}

function buildAuditEvents(runs: WorkflowRun[]): AuditEvent[] {
  return runs
    .filter((run) => run.status !== "completed" || run.fallbackUsed)
    .slice(0, 36)
    .map((run, index) => ({
      id: `audit-${index + 1}`,
      timestamp: run.completedAt,
      actor: run.fallbackUsed ? "workflow-engine" : "policy-gate",
      action: run.status === "human_review" ? "ROUTED_TO_REVIEW" : run.status === "dead_letter" ? "DEAD_LETTERED" : "FALLBACK_COMPLETED",
      workflowRunId: run.id,
      patientHash: run.patientHash,
      detail: run.reason,
    }));
}

export function runSimulation(seed = 17): SimulationSnapshot {
  const bundle = buildSyntheticFhirBundle();
  const violations = findProhibitedFields(bundle);
  const runs = generateRuns(seed);
  const completed = runs.filter((run) => run.status === "completed").length;
  const review = runs.filter((run) => run.status === "human_review").length;
  const deadLetter = runs.filter((run) => run.status === "dead_letter").length;
  const fallback = runs.filter((run) => run.fallbackUsed).length;
  const totalMinutes = runs.reduce((sum, run) => sum + run.manualMinutesAvoided, 0);
  const totalCost = runs.reduce((sum, run) => sum + run.modelCostUsd, 0);
  return {
    generatedAt: new Date(Date.UTC(2026, 7, 25, 12, seed)).toISOString(),
    seed,
    synthetic: true,
    fhirResourceCount: bundle.entry.length,
    prohibitedFieldViolations: violations.length,
    metrics: {
      totalRuns: runs.length,
      successRate: Number(((completed / runs.length) * 100).toFixed(1)),
      humanReviewRate: Number(((review / runs.length) * 100).toFixed(1)),
      deadLetterRate: Number(((deadLetter / runs.length) * 100).toFixed(1)),
      fallbackRate: Number(((fallback / runs.length) * 100).toFixed(1)),
      p95LatencyMs: percentile(runs.map((run) => run.latencyMs), 95),
      modeledHoursAvoided: Number((totalMinutes / 60).toFixed(1)),
      totalModelCostUsd: Number(totalCost.toFixed(2)),
    },
    runs,
    roadmap: buildRoadmap(),
    vendors: buildVendors(),
    auditEvents: buildAuditEvents(runs),
  };
}
