import { describe, expect, it } from "vitest";
import { buildSyntheticFhirBundle, findProhibitedFields } from "@/lib/fhir-fixtures";
import { runSimulation } from "@/lib/workflow-engine";

describe("public-data privacy boundary", () => {
  it("contains only synthetic FHIR identifiers and no direct patient fields", () => {
    const bundle = buildSyntheticFhirBundle();
    expect(findProhibitedFields(bundle)).toEqual([]);
    expect(JSON.stringify(bundle)).not.toMatch(/birthDate|address|telecom|patient name/i);
  });

  it("uses irreversible display hashes in workflow records", () => {
    const snapshot = runSimulation(17);
    expect(snapshot.prohibitedFieldViolations).toBe(0);
    snapshot.runs.forEach((run) => {
      expect(run.patientHash).toMatch(/^[a-f0-9]{12}$/);
      expect(run.patientHash).not.toContain("pt-");
    });
  });
});
