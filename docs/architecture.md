# Architecture

## Control flow

1. A synthetic FHIR R4 bundle supplies `Patient`, `Coverage`, `Claim`, and `Task` resources without direct identifiers.
2. The workflow engine creates deterministic eligibility, authorization, claim-status, and appointment-follow-up runs.
3. API-first integrations are preferred. A synthetic portal robot represents the last-mile fallback when an API times out.
4. Policy gates route conflicting evidence to human review and exhausted retries to a dead-letter queue.
5. Audit events retain run IDs, hashed patient identifiers, owners, actions, and reasons without PHI.
6. The control plane aggregates reliability, latency, fallback, capacity, roadmap, and vendor-scorecard views.
7. A fixed eight-case evaluation corpus covers normal, ambiguous, high-risk, adversarial, and duplicate-action scenarios.
8. A `ModelAdapter` boundary separates deterministic replay from optional live-provider execution. The public API uses replay mode only.
9. Versioned prompts, citation checks, evidence reconciliation, idempotency policy, and action withholding are captured in an inspectable tool trace.
10. Release metrics include decision accuracy, escalation precision, high-risk unsafe auto-action rate, five-bin expected calibration error, p95 latency, tokens, and estimated cost.

## Production boundary

The public deployment is a deterministic simulation. The checked-in Anthropic adapter demonstrates the server-side provider contract but is not enabled in the public flow. A production implementation would add OAuth2 SMART-on-FHIR, encrypted persistence, durable queues, secrets management, identity and role-based access, OpenTelemetry export, evaluation-dataset governance, drift monitoring, and organization-specific legal and security review.

## Key decisions

- **FHIR first:** establishes a standard integration contract instead of modeling one proprietary EHR.
- **Deterministic public engine:** makes every result reproducible and prevents unsupported LLM behavior claims.
- **Provider adapter boundary:** keeps replay and live execution behind the same typed request/response contract without exposing credentials to the browser.
- **Versioned evaluation:** makes a safety regression visible before an agent version can be promoted.
- **Evidence before action:** requires citations, reconciliation, and idempotency checks before autonomous completion.
- **Portal fallback:** demonstrates the operational tradeoff without automating a real payer site.
- **Hashed identifiers:** preserves traceability while excluding direct patient fields.
- **Controls attached to roadmap items:** prevents an automation backlog from becoming a list of ungoverned ideas.
