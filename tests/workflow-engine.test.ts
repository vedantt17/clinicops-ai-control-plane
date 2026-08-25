import { describe, expect, it } from "vitest";
import { runSimulation } from "@/lib/workflow-engine";

describe("ClinicOps workflow simulation", () => {
  it("produces a deterministic 240-run snapshot", () => {
    const first = runSimulation(17);
    const second = runSimulation(17);
    expect(first.runs).toHaveLength(240);
    expect(first).toEqual(second);
    expect(first.fhirResourceCount).toBe(240);
  });

  it("routes failures into explicit review and dead-letter states", () => {
    const snapshot = runSimulation(17);
    expect(snapshot.runs.some((run) => run.status === "human_review")).toBe(true);
    expect(snapshot.runs.some((run) => run.status === "dead_letter")).toBe(true);
    expect(snapshot.runs.filter((run) => run.fallbackUsed).every((run) => run.attempts >= 2)).toBe(true);
    expect(snapshot.auditEvents.length).toBeGreaterThan(20);
  });

  it("computes bounded operational metrics", () => {
    const { metrics } = runSimulation(17);
    expect(metrics.successRate).toBeGreaterThan(80);
    expect(metrics.successRate).toBeLessThan(100);
    expect(metrics.p95LatencyMs).toBeGreaterThan(1_000);
    expect(metrics.modeledHoursAvoided).toBeGreaterThan(30);
    expect(metrics.totalModelCostUsd).toBeGreaterThan(1);
  });

  it("calculates roadmap capacity from transparent assumptions", () => {
    const snapshot = runSimulation(17);
    expect(snapshot.roadmap).toHaveLength(6);
    snapshot.roadmap.forEach((item) => {
      expect(item.modeledMonthlyHours).toBeCloseTo((item.monthlyVolume * item.minutesPerCase) / 60, 1);
      expect(item.control.length).toBeGreaterThan(10);
    });
  });

  it("ranks vendor approaches with a reproducible weighted score", () => {
    const snapshot = runSimulation(17);
    expect(snapshot.vendors).toHaveLength(3);
    snapshot.vendors.forEach((vendor) => {
      const expected = vendor.reliability * 0.35 + vendor.security * 0.3 + vendor.implementation * 0.2 + vendor.cost * 0.15;
      expect(vendor.weightedScore).toBeCloseTo(expected, 1);
    });
  });
});
