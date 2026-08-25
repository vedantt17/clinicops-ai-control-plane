# Security and Privacy Boundary

- No PHI, PII, credentials, or real provider data is included.
- A recursive privacy check rejects prohibited FHIR fields in automated tests.
- Patient references are converted to 12-character SHA-256 display hashes with a public simulation salt.
- Public APIs accept only a bounded integer seed and return generated data.
- `.env*` files are ignored; `.env.example` contains no secrets.
- Production adapters require OAuth2, encrypted storage, key rotation, RBAC, tenant isolation, audit retention, and security review before handling covered data.

This project demonstrates operational architecture. It is not HIPAA certification, a clinical system, or authorization to process protected information.
