# Security and Privacy Boundary

- No PHI, PII, credentials, or real provider data is included.
- A recursive privacy check rejects prohibited FHIR fields in automated tests.
- Patient references are converted to 12-character SHA-256 display hashes with a public simulation salt.
- Public APIs accept only a bounded integer seed and return generated data.
- The public evaluation endpoint accepts only two known agent-version identifiers and uses deterministic replay.
- Live-provider credentials remain server-side inside the adapter boundary; no credential or live model call is exposed to the browser.
- Retrieved text is treated as untrusted input, and adversarial instruction cases must route to human review.
- Idempotency and citation checks are represented as explicit policy gates before an autonomous action.
- `.env*` files are ignored; `.env.example` contains no secrets.
- Production adapters require OAuth2, encrypted storage, key rotation, RBAC, tenant isolation, audit retention, and security review before handling covered data.

This project demonstrates operational architecture. It is not HIPAA certification, a clinical system, a validated medical device, or authorization to process protected information.
