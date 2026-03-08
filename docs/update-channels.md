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
- Every release must pass: unit tests, manifest validation, policy scan, and smoke checks.

## 3) Release flow

### 3.1 Build

1. Clean and create `dist/`.
2. Build zip artifact: `dist/tuguide-v<version>-unsigned.zip`.
3. Verify artifact contains only extension/runtime docs and assets.

### 3.2 CWS flow (required)

1. Upload the release zip to CWS dashboard.
2. Submit/update listing metadata and permission rationale.
3. Track review status and release approval.
4. Validate install/update in a clean Chrome profile.

### 3.3 Self-hosted flow (optional)

1. Publish the same release artifact to controlled storage.
2. Update deployment metadata (`updates.xml` or org-specific metadata equivalent).
3. Validate install/update in staging before production promotion.
4. Keep at least two previous versions available for rollback.

## 4) Rollback

- **CWS rollback:** disable affected release or expedite hotfix with incremented patch version.
- **Self-hosted rollback (if enabled):** re-point update metadata to last known-good release and verify staging before production.

## 5) Operator checklist

1. Confirm version bump in `manifest.json`.
2. Run `npm run test:unit`.
3. Run `npm run validate:manifest`.
4. Run `npm run scan:policy`.
5. Build release artifact.
6. Publish CWS candidate.
7. If self-hosted is active, publish metadata and validate staging.
8. Validate production update uptake.
9. Record release notes and rollback readiness.
