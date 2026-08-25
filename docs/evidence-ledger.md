# Evidence Ledger

| Claim | Evidence | Classification | Safe wording |
| --- | --- | --- | --- |
| 240 FHIR resources | `buildSyntheticFhirBundle()` and unit test | Measured synthetic scale | Processed 240 synthetic FHIR resources |
| 240 workflow runs | `generateRuns()` and unit test | Measured synthetic scale | Simulated 240 healthcare operations runs |
| Six roadmap opportunities | `buildRoadmap()` and unit test | Implemented capability | Prioritized six automation opportunities |
| Three vendor approaches | `buildVendors()` and unit test | Implemented capability | Scored three integration approaches |
| Privacy violations | `privacy.test.ts` | Measured | Passed automated checks with zero prohibited FHIR fields |
| Automated test count | Test command output | Measured at release | Report only the final passing test count |
| Modeled hours avoided | Transparent volume × minutes formula | Scenario, not realized impact | Label as modeled capacity only; do not claim savings |
| Success, review, dead-letter, fallback, latency, and cost | Deterministic simulation output | Scenario | Describe as simulated metrics, not production performance |
| Eight evaluation cases | `EVALUATION_CORPUS` and agent-evaluation tests | Measured synthetic scale | Replayed eight checked-in normal and adversarial cases |
| Two agent versions | `runEvaluation()` and AI Lab segmented control | Implemented capability | Compared baseline and guardrailed agent versions |
| 100% guarded accuracy and 0% unsafe auto-action | Fixed replay corpus and automated safety test | Measured synthetic result | Always qualify as replay-corpus performance, never production model quality |
| Tool traces and citations | `ModelResponse.trace`, evidence references, and Playwright flow | Implemented capability | Exposed inspectable synthetic tool traces and source references |
| Optional live provider | `AnthropicAdapter` | Implementation scaffold | State that a server-side adapter exists; do not claim live public execution |
