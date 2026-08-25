# Operations Runbook

## Healthy state

- Success rate remains above the configured operating threshold.
- Dead-letter rate remains below the configured error budget.
- FHIR privacy validation reports zero prohibited fields.
- Portal fallback is used only after an API failure and remains within its retry budget.

## Triage sequence

1. Open the exception queue and identify the affected workflow, site, channel, and owner.
2. Review attempts and the failure reason before restarting anything.
3. For evidence conflicts, preserve the automation output and route to human review.
4. For upstream timeouts, retry with idempotency preserved, then invoke the portal fallback if policy allows.
5. After the retry budget is exhausted, dead-letter the case and assign an accountable owner.
6. Record the corrective action and closure evidence in the audit log.

## Change management

- Version input and output contracts.
- Run unit, privacy, and browser-flow tests before release.
- Publish release notes and a rollback plan.
- Train operators on new exception states before changing routing.
- Review modeled ROI after observed production baselines are available.
