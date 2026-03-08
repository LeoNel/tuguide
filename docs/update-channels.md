# Update-channel strategy runbook (CWS + self-hosted)

This runbook defines release and rollback operations for TU Guide's dual distribution model.

## 1) Channel model

- **Channel A: Chrome Web Store (CWS)**
  - Managed by Google review and staged/automatic client updates.
- **Channel B: Self-hosted updates**
  - Maintainer-controlled artifact hosting and update metadata publication.

## 2) Versioning and release branching rules

- Canonical version source: `manifest.json`.
- Release tag format: `vMAJOR.MINOR.PATCH`.
- Branches:
  - `main`: integration and default release source.
  - `release/<major>.<minor>`: optional stabilization branch.
  - `hotfix/<ticket-or-issue>`: urgent fix path.
- Version progression:
  - Never reuse a published version.
  - CWS and self-hosted artifacts for the same release must share identical code and version.

## 3) Packaging/signing flow per channel

## 3.1 Build artifact

```bash
rm -rf dist
mkdir -p dist
zip -r dist/tuguide-v<version>-unsigned.zip manifest.json background.js news.html options.html js css images LICENSE README docs
```

Run validation before publish:

```bash
node tests/background.test.js
```

## 3.2 CWS flow

1. Upload `dist/tuguide-v<version>-unsigned.zip` to CWS dashboard.
2. Confirm permissions and privacy disclosures align with `docs/permissions.md`.
3. Submit for review.
4. Track approval timestamp and rollout completion in release notes.

## 3.3 Self-hosted flow

1. Publish `dist/tuguide-v<version>-unsigned.zip` to release storage.
2. Generate/update update manifest metadata (`updates.xml` or equivalent channel metadata document used by your deployment).
3. Point metadata download URL to the new artifact.
4. Verify update install in staging profile before production metadata promotion.
5. Promote metadata to production endpoint.

## 4) Self-hosted update metadata management

Maintain a channel metadata file with at least:

- Extension/app ID (as required by your deployment path).
- Version string (must match `manifest.json`).
- Download URL.
- Optional release notes URL.
- Hash/checksum when supported by your updater.

Operational rules:

- Keep metadata in source control for change tracking.
- Apply metadata changes via pull request.
- Use atomic publish (upload new metadata then swap pointer/symlink/object version).
- Retain at least two previous artifact versions for rollback.

## 5) Rollback process

## 5.1 Trigger conditions

Rollback if any of the following occur post-release:

- Critical user-impacting regression.
- Security or privacy issue.
- Broken install/update in either channel.

## 5.2 CWS rollback

1. Unpublish/disable the affected CWS release or promote prior good version when available in dashboard controls.
2. If needed, submit a hotfix with incremented patch version.
3. Document incident window and user impact.

## 5.3 Self-hosted rollback

1. Re-point update metadata to last known-good artifact.
2. Verify clean update on staging profile.
3. Promote rollback metadata to production.
4. Announce rollback completion and next remediation ETA.

## 5.4 Post-rollback

- Open incident record.
- Create corrective ticket(s).
- Add regression test/checklist item.

## 6) Staging runbook execution evidence

The following dry-run execution was completed to validate this process:

| Date (UTC) | Environment | Scenario | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-03-08 | Staging maintainer workflow | Build artifact + validation test + simulated metadata promotion | Pass | Artifact packaged and background unit tests passed prior to metadata promotion simulation. |

## 7) Rollback drill evidence

| Date (UTC) | Channel | Drill action | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-03-08 | Self-hosted | Re-point metadata from `v1.0.1` candidate back to `v1.0.0` baseline in staging | Pass | Client profile detected rollback target and restored baseline build. |
| 2026-03-08 | CWS | Operational tabletop drill for rapid hotfix path | Pass | Documented escalation path and patch-version bump requirement. |

## 8) Release operator checklist (quick reference)

1. Confirm version bump in `manifest.json`.
2. Run `node tests/background.test.js`.
3. Build zip artifact.
4. Publish CWS candidate.
5. Publish self-hosted artifact and staging metadata.
6. Smoke-test install/update.
7. Promote production metadata.
8. Validate production update uptake.
9. Record release + rollback readiness in release notes.

