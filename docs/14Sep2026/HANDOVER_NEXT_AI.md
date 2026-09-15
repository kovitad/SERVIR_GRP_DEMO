# Current handover for the next AI / developer

**Prepared:** 14 September 2026

**Repository:** `https://github.com/kovitad/SERVIR_GRP_DEMO.git`

**Branch:** `main`

**Deployable source of truth:** `prototype/github/` in the parent workspace

## Start here

Read these files before changing implementation claims:

1. [`../../HANDOVER.md`](../../HANDOVER.md) — full application, deployment and security handover.
2. [`SIG_MCP_CONNECTION_TEST.md`](SIG_MCP_CONNECTION_TEST.md) — repeatable OAuth/MCP contract and bounded Risk test procedure.
3. [`sig-mcp-live-capture.json`](sig-mcp-live-capture.json) — exact authenticated tool schemas and latest bounded Risk output.
4. [`../10Sep2026/PROTOTYPE_ARCHITECTURE_ALIGNMENT_REVIEW.md`](../10Sep2026/PROTOTYPE_ARCHITECTURE_ALIGNMENT_REVIEW.md) — architecture decisions and remaining connector gaps.
5. [`../11Sep2026/HANDOVER_RELEASE_0.10.1.md`](../11Sep2026/HANDOVER_RELEASE_0.10.1.md) — release 0.10.1 workflow and localhost-fix baseline.

## Repository state at handover

The working release remains `0.10.1`. The current local branch contains:

- `f544eed` — Claude's dependency-free SIG MCP OAuth/PKCE contract-capture utility and documentation.
- `6d8dea3` — authenticated live Risk validation, captured evidence, updated integration truth and optional `--test-risk` support.

At the time this handover was drafted, these commits had not yet been pushed to `origin/main`. Check rather than assume:

```bash
git status --short --branch
git log -4 --oneline --decorate
```

Do not overwrite or discard the ignored `.env`, `storage/`, feedback volume, logs or PID files.

## What is working

### Deployable GRP prototype

- Caddy static frontend plus a separate Node.js backend packaged with Docker Compose.
- Planner/Admin authentication and one-click demo Planner access.
- OpenStreetMap/Leaflet map, EN/TH localization and feedback workflow.
- Prepared centre CSV/GeoJSON and flood TIFF/GeoTIFF upload and persistent Hub catalogue.
- Seven static return-period choices and deterministic stored assessments.
- RP A/B comparison with comparable-centre transitions, seven-scenario progression, schematic maps, vulnerability overlap, evidence and limitations.
- Admin workflow trace, assurance views and the existing controlled OpenAI/Langfuse pilot.

The Planner workflow remains a local Hub prototype. Its GIS values are deterministic fixtures, not approved analysis.

### Live SIG MCP validation

The following were authenticated and executed successfully against:

```text
https://servirplatform.sig-gis.com/mcp
```

- OAuth 2.1 authorization-code flow with PKCE through WorkOS AuthKit and Google SSO.
- MCP protocol negotiation: `2025-06-18`.
- Server identity: `servirplatform` version `4.0.0`.
- Fifteen tools enumerated with full schemas.
- Live inventory matched all fifteen tool names claimed by the prototype.
- `platform_capabilities` returned successfully.
- `assemble_pack(pack="risk", place="Phaya Thai District, Bangkok, Thailand", hazard="flood")` returned successfully.
- Latest captured Risk pack: `7a2ac7b16c28a304`.

The registered hazard identifier is `flood`. The value `river flood` was correctly declined.

The live Risk evidence is a 100-year flood hazard-exposure pack covering hospitals, schools, buildings and roads. It is not the Planner's seven-return-period evacuation-centre comparison and must not be merged numerically with that result.

## Critical truth boundary

Three things must remain visibly separate:

1. **Generic upstream SIG Risk pack — validated live.**
2. **GRP Planner Hub assessment — working locally with deterministic fixtures.**
3. **Proposed `grp-flood.gather(target, focus, trace, extras)` connector — not implemented or connected.**

`grp-flood.gather(...)` is a proposed internal domain-pack extension behind the existing SIG `assemble_pack` route. It is not a new MCP tool. Do not invent `grp_*` tools.

The current `assemble_pack` MCP schema accepts `pack`, `place`, `hazard`, `focus` and related food-security fields. It does not expose a Hub assessment ID or private-result authorization contract. Therefore the current successful generic Risk call does not prove that SIG can read a stored Hub assessment.

The deployed Planner still makes no SIG MCP call. It issues no real SIG `pack_id`, `report_id` or `receipt_id`. Existing Planner receipt values are explicitly local placeholders.

## Evidence gaps returned by live Risk

The captured pack declares:

- no Risk document corpus;
- unknown/incomplete raster publication date, version and licence metadata;
- no L1/L2 vulnerability-weighted risk result in the pack;
- no OSM asset retrieval date.

Tool success is not scientific approval. Preserve these gaps in any UI or proposal.

## Re-running the capture

Discovery only:

```bash
node scripts/sig-mcp-capture.js --discover-only
```

Authenticated inventory plus bounded generic Risk test:

```bash
node scripts/sig-mcp-capture.js --test-risk --port 8768 \
  --place "Phaya Thai District, Bangkok, Thailand" \
  --hazard flood \
  --focus "evacuation-centre exposure across return periods"
```

A human must complete SSO and consent in the browser. The script does not persist access or refresh tokens. Review every generated evidence file before committing because Risk output contains upstream evidence values.

Do not run `publish_answer` merely to make a demo look complete. It requires an exact draft using the pack's required headings and citations and creates a governed report/receipt record.

## Recommended next implementation

### Phase A — controlled evidence-only spike

Build a reusable MCP client inside the Node backend, not in browser JavaScript:

1. OAuth discovery and a fixed production client registration.
2. HTTPS callback on the deployed application domain.
3. Server-side, short-lived encrypted token handling.
4. Admin-only connect, status, expiry and disconnect controls.
5. `initialize`, `tools/list` and exact contract-drift validation.
6. Bounded `platform_capabilities` and generic Risk `assemble_pack` calls.
7. A separate SIG evidence panel showing pack ID, citations, method, gaps and execution duration.
8. Clear fallback when SIG is unavailable; the Hub assessment must continue working.

Do not expose provider or OAuth tokens to frontend code, application logs, Langfuse, screenshots or committed evidence.

### Phase B — actual Hub-to-SIG connection

Agree with the SIG team how the internal Risk pack will resolve an authorised immutable Hub assessment. The protected contract needs:

- assessment/result target identifier;
- delegated user and Hub authorization;
- exact dataset-version manifest;
- trace/correlation propagation;
- timeout and retry semantics;
- privacy rules preventing raw private upload transfer;
- citations and declared gaps referencing the same canonical Hub result.

Only after that contract exists should `grp-flood.gather(...)` be described as connected.

### Phase C — governed answer

After the protected connector works:

1. Assemble a pack for the stored Hub result.
2. Draft from that pack using the existing server-side model workflow or an explicitly approved alternative.
3. Use the exact required section headers and cite every paragraph.
4. Call `publish_answer(pack_id, draft, question)`.
5. Persist the real `pack_id`, `report_id`, `receipt_id`, assessment ID, trace ID and draft hash.
6. Render the server-resolved evidence/receipt component; do not paint a permanent local “verified” badge.

## Validation already completed

- Fresh authenticated MCP capture and generic Risk call.
- Exact 15/15 live-versus-prototype tool match.
- No access token, refresh token value or account identifier in committed captures.
- Frontend/backend/capture-script JavaScript syntax checks.
- Python and deployment-shell syntax checks.
- Docker Compose configuration validation.
- Both Docker images built successfully.
- Local browser test confirmed updated generic-Risk-versus-Hub-connector wording and a working RP comparison with no console errors.

## Before push or AWS deployment

```bash
git diff --check
git status --short --branch
docker compose config --quiet
docker compose build
```

Then push and confirm GitHub Actions before updating AWS. Keep `AI_FEATURE_ALLOWED=false` unless an approved HTTPS live-AI window is being run. The current `SITE_ADDRESS=:80` configuration is suitable only for the accepted non-sensitive, AI-disabled demonstration.
