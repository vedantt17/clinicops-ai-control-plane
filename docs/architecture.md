# Architecture

## Control flow

1. A synthetic FHIR R4 bundle supplies `Patient`, `Coverage`, `Claim`, and `Task` resources without direct identifiers.
2. The workflow engine creates deterministic eligibility, authorization, claim-status, and appointment-follow-up runs.
3. API-first integrations are preferred. A synthetic portal robot represents the last-mile fallback when an API times out.
4. Policy gates route conflicting evidence to human review and exhausted retries to a dead-letter queue.
5. Audit events retain run IDs, hashed patient identifiers, owners, actions, and reasons without PHI.
6. The control plane aggregates reliability, latency, fallback, capacity, roadmap, and vendor-scorecard views.

## Production boundary

The public deployment is a deterministic simulation. A production implementation would add an OAuth2 SMART-on-FHIR client, encrypted persistence, queue infrastructure, secrets management, identity and role-based access, OpenTelemetry export, and organization-specific legal and security review.

## Key decisions

- **FHIR first:** establishes a standard integration contract instead of modeling one proprietary EHR.
- **Deterministic public engine:** makes every result reproducible and prevents unsupported LLM behavior claims.
- **Portal fallback:** demonstrates the operational tradeoff without automating a real payer site.
- **Hashed identifiers:** preserves traceability while excluding direct patient fields.
- **Controls attached to roadmap items:** prevents an automation backlog from becoming a list of ungoverned ideas.
