import type { FhirBundle, FhirResource } from "./types";

const PATIENT_COUNT = 60;

function resource(resourceType: FhirResource["resourceType"], id: string, patientId: string): FhirResource {
  if (resourceType === "Patient") {
    return {
      resourceType,
      id,
      identifier: [{ system: "urn:clinicops:synthetic-patient", value: `SYN-${patientId}` }],
    };
  }
  if (resourceType === "Coverage") {
    return { resourceType, id, status: "active", patient: { reference: `Patient/${patientId}` } };
  }
  if (resourceType === "Claim") {
    return {
      resourceType,
      id,
      status: "active",
      patient: { reference: `Patient/${patientId}` },
      insurance: [{ sequence: 1, focal: true, coverage: { reference: `Coverage/cov-${patientId}` } }],
    };
  }
  return {
    resourceType,
    id,
    status: "requested",
    intent: "order",
    subject: { reference: `Patient/${patientId}` },
    code: { text: "Synthetic operations follow-up" },
  };
}

export function buildSyntheticFhirBundle(): FhirBundle {
  const entry: FhirBundle["entry"] = [];
  for (let i = 1; i <= PATIENT_COUNT; i += 1) {
    const patientId = `pt-${i.toString().padStart(3, "0")}`;
    const resources: FhirResource[] = [
      resource("Patient", patientId, patientId),
      resource("Coverage", `cov-${patientId}`, patientId),
      resource("Claim", `clm-${patientId}`, patientId),
      resource("Task", `task-${patientId}`, patientId),
    ];
    resources.forEach((item) => {
      entry.push({ fullUrl: `urn:uuid:${item.id}`, resource: item });
    });
  }
  return {
    resourceType: "Bundle",
    type: "collection",
    timestamp: "2026-08-25T12:00:00.000Z",
    entry,
  };
}

const PROHIBITED_FIELDS = new Set(["name", "birthDate", "address", "telecom", "photo"]);

export function findProhibitedFields(bundle: FhirBundle): string[] {
  const violations: string[] = [];
  const inspect = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => inspect(item, `${path}[${index}]`));
      return;
    }
    if (value && typeof value === "object") {
      Object.entries(value).forEach(([key, child]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (PROHIBITED_FIELDS.has(key)) violations.push(nextPath);
        inspect(child, nextPath);
      });
    }
  };
  inspect(bundle, "bundle");
  return violations;
}
