# Update-channel strategy runbook (CWS primary, optional self-hosted)

## 1) Channel model

- **Primary production channel: Chrome Web Store (CWS)**
  - CWS = **Chrome Web Store**.
  - Google handles review and rollout for store-installed users.
- **Optional secondary channel: self-hosted updates**
  - Only used if an organization deploys the extension outside CWS-managed installs.

## 2) Invariants

- `manifest.json` version is authoritative.
- CWS and any optional self-hosted artifacts for the same release must share identical code and version.
- Every release must pass: unit tests, manifest validation, policy scan, lint, and formatting checks.

## 3) Security gates (required pre-release)

Run all commands from repository root:

1. `npm run test:unit` → all unit and regression suites pass.
2. `npm run validate:manifest` → manifest hardening checks pass (CSP, permission baseline, host scope).
3. `npm run scan:policy` → no policy violations (DOM/script sink checks included).
4. `npm run lint` → no lint errors.
5. `npm run format:check` → no formatting drift.
6. `npm run test:e2e` (when Chromium runtime is available) → smoke checks pass for popup/options behavior.

Any failing gate blocks release publication.

## 4) Release flow

### 4.1 Build

1. Clean and create `dist/`.
2. Build zip artifact: `dist/tuguide-v<version>-unsigned.zip`.
3. Verify artifact contains only extension/runtime docs and assets.

### 4.2 CWS flow (required)

1. Upload the release zip to CWS dashboard.
2. Submit/update listing metadata and permission rationale.
3. Track review status and release approval.
4. Validate install/update in a clean Chrome profile.

### 4.3 Self-hosted flow (optional)

1. Publish the same release artifact to controlled storage.
2. Update deployment metadata (`updates.xml` or org-specific metadata equivalent).
3. Validate install/update in staging before production promotion.
4. Keep at least two previous versions available for rollback.

## 5) Rollback

- **CWS rollback:** disable affected release or expedite hotfix with incremented patch version.
- **Self-hosted rollback (if enabled):** re-point update metadata to last known-good release and verify staging before production.

## 6) Operator checklist

1. Confirm version bump in `manifest.json`.
2. Run all security gates.
3. Build release artifact.
4. Publish CWS candidate.
5. If self-hosted is active, publish metadata and validate staging.
6. Validate production update uptake.
7. Record release notes and rollback readiness.
