# GRP MVP1 Hub–SIG architecture design

**Version:** 1.0

**Date:** 15 September 2026

**Audience:** ADPC and SIG developers, infrastructure administrators, security reviewers and scientific owners

**Status:** implementation baseline subject to the approval gates and open decisions in this document

## 1. Purpose and decision summary

This design turns the validated 14 September MCP experiments into an implementable first slice across a developer machine, the ADPC staging VM and the ADPC production VM.

The agreed direction is:

- ADPC owns the Hub application, users, private datasets, GIS execution, jobs and canonical results.
- SIG owns the existing MCP service, the existing Risk pack, evidence gate, receipts and public resolver.
- The existing SIG Risk pack will be enhanced rather than duplicated.
- The enhanced pack may call an ADPC-hosted HTTPS service.
- The pack reads a completed immutable Hub assessment; it does not receive raw uploads and does not recompute GIS.
- No GRP MCP server and no parallel RAG layer will be built for MVP1.
- Long GIS work runs asynchronously on the Hub. SIG pack assembly reads a prepared result quickly.
- A grounded receipt proves evidence traceability, not correct geography, source truth or scientific approval.

The first production-shaped slice is one approved Chiang Yuen District RP100 flood assessment, one evacuation-centre dataset, one method version, one signed golden result, one Risk-pack enhancement and one governed receipt.

## 2. Basis and confirmed infrastructure

### 2.1 Evidence basis

This design uses:

- the 10 September distributed architecture proposal;
- the 14 September first-slice technical design v0.2;
- three authenticated live Risk runs;
- two minted generic Risk receipts;
- the captured MCP 15-tool contract and protocol `2025-06-18`;
- the 15 September VM provisioning email; and
- the current release 0.10.1 prototype as the UX and workflow reference.

The live tests established a 52–152 second assembly range, a working gate/receipt finish, and a serious free-text AOI failure: tambon and province queries silently used an approximately 12 km fallback box. The architecture therefore fails closed on unsupported geography and never treats a receipt as proof that the requested boundary was used.

### 2.2 Environment matrix

| Environment | Hostname | Capacity | Purpose |
|---|---|---:|---|
| Developer | Local workstation | Existing Docker-capable machine | Development, unit tests, golden tests and local integration mocks |
| Staging | `staging-risk-servir.adpc.net` | 4 vCPU, 16 GB RAM, 250 GB disk | Shared integration, SIG-to-Hub calls, restore tests and acceptance |
| Production | `risk-servir.adpc.net` | 4 vCPU, 32 GB RAM, 500 GB disk; 8 vCPU preferred | Controlled MVP1 pilot |

Ubuntu 24.04 LTS is preferred; 22.04 LTS is acceptable if it is ADPC’s standard. ADPC operates the Hub software. Named ADPC/SIG maintainers receive individual SSH-key accounts and appropriate sudo access; shared Unix accounts are prohibited.

The email requests DNS and internet-facing TCP 443 because SIG must call the Hub. Port 443 is the only application ingress. Port 80 may be used only for ACME and HTTPS redirection. SSH is restricted to ADPC VPN/management ranges or a bastion, uses keys only, and is never unrestricted password access from the internet.

Provisioned IP addresses, DNS resolution, firewall rules, backup destination and account creation remain deployment checklist items; they are not present in the email.

## 3. Scope and non-goals

### 3.1 In scope

- Hub API and worker with a durable PostGIS-backed job record.
- Immutable and versioned boundary, hazard, evacuation-centre and method references.
- Signed Chiang Yuen golden result asserted in CI.
- Protected read-only evidence endpoint for the SIG Risk pack.
- Enhancement of the existing Risk pack with an explicit Hub assessment reference.
- Citation generation, declared gaps, groundedness gate and receipt linkage.
- HTTPS deployment to staging and production.
- Authentication, authorization, audit, backup, health and operational telemetry.
- Current static Planner UI retained as the interaction reference and incrementally connected to canonical APIs.

### 3.2 Explicitly out of scope for the first slice

- A new GRP MCP server.
- A second document retrieval or RAG stack.
- Vulnerability-weighted risk until the scientific owner approves a layer and meaning.
- Browser upload in the production-shaped backend; developer-loaded first-slice data is acceptable.
- RP comparison in the production backend.
- Free-text Planner AI questions.
- Additional hazards, administrative levels, hubs and real-time feeds.
- Automatic public publication of private Hub results.
- Next.js migration solely for the first slice.

The current prototype may continue to demonstrate upload and RP comparison, but those outputs remain fixtures until the production-shaped backend implements them.

## 4. Architecture principles

1. **One canonical result.** Map, list, summary, download and evidence adapter read one immutable Hub assessment result.
2. **Explicit immutable inputs.** Every assessment pins boundary, hazard, centre dataset and method versions plus content hashes.
3. **Fail closed.** No fallback boundary, provider, scenario, input or execution route.
4. **Asynchronous GIS.** Submission returns an assessment ID in under one second; workers perform computation.
5. **Thin SIG pack.** The pack calls an allowlisted Hub endpoint, formats citations and declares gaps. It stores no Hub source data and performs no GIS arithmetic.
6. **Separate trust facts.** Authentication, Hub membership, scientific approval, operational success and groundedness are independent states.
7. **No evidence duplication.** ADPC stores SIG identifiers and linkage, not a competing mutable copy of the receipt.
8. **Private by default.** A successful private assessment is not approval to put its values in a publicly resolvable receipt.
9. **Server-held credentials.** OAuth tokens, machine credentials and model keys never reach browser code.
10. **Replaceable infrastructure seams.** Filesystem storage, database jobs and a single worker are small first-slice implementations behind stable interfaces.

## 5. System context and trust boundaries

There are four security zones:

- **Planner browser:** untrusted client; receives only authorized presentation data and an HttpOnly application session.
- **ADPC Hub:** authoritative user membership, working state, private datasets, methods, jobs and results.
- **SIG platform:** independently authenticated MCP service, enhanced Risk pack, gate, receipt store and resolver.
- **External sources:** approved raster/document providers and identity providers; never treated as implicitly trusted because they are external.

A Planner action creates a Hub assessment. Once it succeeds, an authorized orchestration action calls SIG `assemble_pack` with an opaque Hub assessment reference. The SIG Risk pack resolves the configured ADPC Hub base URL from its own allowlisted registry, authenticates as the SIG pack service, and reads the evidence representation. The pack then returns numbered citations and gaps. Drafting remains outside deterministic assembly. `publish_answer` gates the draft and mints a receipt only after publication/privacy policy allows it.

## 6. Deployment topology

### 6.1 VM layout

Each ADPC VM runs:

- host-level Caddy for TLS termination, security headers, static frontend delivery and reverse proxying;
- `grp-api` container: FastAPI application, authentication/session boundary, authorization, validation, job submission, status, result/evidence APIs and audit writes;
- `grp-worker` container: same application image with a worker entry point; claims jobs and executes approved GIS methods;
- `grp-db` container: `postgis/postgis:16-3.4`, accessible only on the private Compose network.

This preserves the proposed three application containers. Caddy is a host edge service managed by systemd. If ADPC policy requires everything containerized, Caddy may become a fourth container without changing application contracts.

Suggested filesystem layout:

```text
/srv/grp/
  app/                 checked-out deployment metadata, no secrets
  releases/            immutable release manifests
  data/
    rasters/           COG files by immutable version/hash
    uploads/           quarantine and accepted private files
    results/           immutable generated result/export objects
  secrets/             root-readable mounted secret files
  backup-staging/      temporary encrypted backup staging only
/var/log/grp/           redacted operational logs if not journald
```

Rasters never go into PostgreSQL. PostgreSQL stores metadata, geometry, state and result JSON. Off-VM backup storage is mandatory; a directory on the same VM is not a backup.

### 6.2 Network exposure

| Port | Source | Destination | Rule |
|---:|---|---|---|
| 443 | Internet, including SIG | Host Caddy | Allow; TLS only |
| 80 | Internet | Host Caddy | Redirect/ACME only |
| 22 | ADPC VPN/bastion/approved management ranges | VM SSH | Allowlisted keys only |
| 8000 | Loopback/Compose edge only | `grp-api` | Never internet-exposed |
| 5432 | Compose private network | `grp-db` | Never host- or internet-exposed |

Outbound access is allowlisted where operationally practical: package/image registry, identity provider, approved source endpoints, SIG MCP and backup destination. DNS and NTP must remain available.

### 6.3 Environment isolation

Staging and production have separate:

- databases and filesystem roots;
- DNS names and TLS certificates;
- OAuth clients/audiences;
- SIG service credentials;
- encryption keys and session secrets;
- model keys and budgets when AI is later enabled;
- receipt/publication policies;
- backup sets and retention.

No production private data is copied to staging. Golden fixtures are synthetic or explicitly approved.

## 7. Component design

### 7.1 `grp-api`

Responsibilities:

- browser backend-for-frontend and secure session cookie;
- OIDC callback and membership resolution when the real identity profile is approved;
- resource-level Hub authorization;
- dataset/boundary/method catalogue reads;
- assessment idempotency, V2 validation and enqueue;
- status, canonical result and paginated centre reads;
- SIG evidence adapter endpoint;
- audit events and correlation IDs;
- health/readiness endpoints.

It does not execute GIS, accept arbitrary outbound URLs or trust caller-supplied roles/hub IDs.

### 7.2 `grp-worker`

Responsibilities:

- claim one queued assessment with `FOR UPDATE SKIP LOCKED`;
- recheck durable authorization and immutable input availability;
- read COG windows rather than loading full rasters;
- clip, overlay, classify and write per-centre statuses;
- enforce V3 invariants;
- write immutable result assets, then atomically complete the assessment;
- retry only classified transient failures.

Start with one worker per VM. On a 4-vCPU host, concurrency defaults to one until measurements prove safe. An 8-vCPU production host may run two workers after memory/disk tests. More workers use the same claim contract; no broker is required for MVP1.

### 7.3 `grp-db`

PostGIS holds twelve first-slice tables:

1. `hub`
2. `app_user`
3. `hub_membership`
4. `boundary`
5. `dataset`
6. `dataset_version`
7. `feature`
8. `method`
9. `assessment`
10. `assessment_feature`
11. `audit_event`
12. `llm_usage`

Every tenant-owned row carries `hub_id`. Dataset versions and completed assessment results are append-only. A replacement creates a new dataset version and changes an explicit current pointer; it never rewrites an earlier version.

The first-slice model remains twelve tables. Since AI is deferred, model pricing is versioned configuration rather than a thirteenth `model_price` table. Add that table in the AI migration when historical price management is required.

### 7.4 Storage adapter

The first implementation uses a protected local directory through `put`, `get`, `exists`, `open_window` and `url_for_internal_use` interfaces. Database rows store generated object keys and hashes, never arbitrary filesystem paths supplied by users. This adapter may later target S3/MinIO without changing assessment contracts.

## 8. Canonical assessment lifecycle

### 8.1 States

```text
queued → running → succeeded
   │         │
   └─────────┴→ failed
queued/running → cancelled (best effort)
```

Prerequisite validation failure returns `422` and creates no job. A failed required analysis never becomes a successful empty result.

### 8.2 Submission

`POST /api/v1/assessments`:

- authenticates the principal;
- resolves Hub membership server-side;
- validates one immutable version for every required input;
- validates boundary/admin level, RP100 hazard, approved method and sharing policy;
- accepts an `Idempotency-Key`;
- creates the assessment and audit event in one transaction;
- returns `202`, `assessment_id`, `Location` and `Retry-After`.

The same principal, Hub, key and canonical payload returns the same assessment. Reusing the key with another payload returns `409`.

### 8.3 Completion invariants

Before persistence:

- every in-scope centre appears exactly once;
- status is exactly one of `potentially_exposed`, `not_exposed_under_scenario`, or `unable_to_assess`;
- every status has an approved reason code;
- the three status counts equal the in-scope count;
- NoData is not converted to zero exposure;
- AOI identifier, geometry hash, source and edition match the submitted manifest;
- the method and all dataset versions/hashes remain pinned.

The golden Chiang Yuen test asserts exact expected classifications and summary counts on every change.

## 9. Hub API contracts

All routes are HTTPS, versioned and protected. Opaque IDs do not replace authorization.

### 9.1 Application API

```text
POST /api/v1/assessments
GET  /api/v1/assessments/{assessment_id}
GET  /api/v1/assessments/{assessment_id}/result
GET  /api/v1/assessments/{assessment_id}/centres
POST /api/v1/assessments/{assessment_id}/cancel
GET  /healthz
GET  /readyz
```

Future upload, dataset-slot, comparison, export and explanation routes follow the distributed architecture specification but are not first-slice blockers.

### 9.2 SIG evidence endpoint

```text
GET /api/v1/integrations/sig/assessments/{assessment_id}/evidence
```

The endpoint:

- accepts only the SIG Risk-pack machine audience and `assessment:evidence:read` scope;
- checks the assessment’s Hub, publication/evidence-sharing state and caller policy;
- returns only a succeeded immutable assessment;
- never returns raw uploaded files, arbitrary download URLs, session data or internal traces;
- is idempotent and read-only;
- emits an audit event and correlation ID;
- uses `404` for inaccessible/unknown IDs to reduce enumeration.

Proposed response shape:

```json
{
  "schema_version": 1,
  "assessment_id": "opaque-uuid",
  "hub_code": "adpc",
  "state": "succeeded",
  "evidence_policy": "approved-public-fixture",
  "aoi": {
    "boundary_id": "opaque-uuid",
    "admin_code": "approved-code",
    "name": "Chiang Yuen District",
    "admin_level": "district",
    "source": "approved ADPC boundary source",
    "edition": "approved edition",
    "geometry_sha256": "..."
  },
  "scenario": {"hazard": "flood", "return_period_years": 100},
  "method": {"key": "centre-flood-overlay", "version": "1.0.0"},
  "datasets": [
    {"role": "hazard", "version_id": "...", "sha256": "...", "provider": "..."},
    {"role": "evacuation_centres", "version_id": "...", "sha256": "...", "provider": "..."}
  ],
  "summary": {
    "in_scope": 0,
    "potentially_exposed": 0,
    "not_exposed_under_scenario": 0,
    "unable_to_assess": 0
  },
  "centres": [],
  "gaps": [],
  "completed_at": "...",
  "workflow_id": "..."
}
```

The evidence adapter formats the canonical result; it must not recalculate counts.

## 10. Existing Risk-pack enhancement

### 10.1 MCP contract change

The current `assemble_pack` schema has `pack`, `place`, `hazard`, `focus` and food-security/override fields, with `additionalProperties: false`. It has no Hub assessment reference. Do not overload `place` with a URL and do not misuse `override` to smuggle private data.

Add one optional, typed field to the existing tool contract, subject to SIG naming approval:

```text
assessment_ref = "grp://adpc/assessments/{opaque-id}"
```

Example:

```text
assemble_pack(
  pack="risk",
  place="Chiang Yuen District, Maha Sarakham, Thailand",
  hazard="flood",
  focus="evacuation-centre exposure for RP100",
  assessment_ref="grp://adpc/assessments/018f..."
)
```

The reference is an identifier, never a credential or caller-controlled HTTP URL. The Risk pack resolves `adpc` through an allowlisted server-side Hub registry. A place label may remain for display, but the Hub boundary/admin code is authoritative. If `place` and Hub evidence disagree, assembly fails with a typed target-mismatch gap/error.

This is an additive schema change to an existing tool, so the inventory remains 15 tools. Update the captured contract fixture and drift test after SIG deploys it.

### 10.2 Gather behaviour

The enhanced Risk gather path:

1. parses and validates the opaque `assessment_ref`;
2. resolves a configured Hub base URL;
3. obtains/uses its machine credential;
4. sends `traceparent` and `X-Correlation-ID`;
5. calls the Hub evidence endpoint with strict connect/read timeouts;
6. rejects non-succeeded, unauthorized, target-mismatched or schema-incompatible results;
7. creates one literal citation for each claimable number;
8. creates citations for method/input lineage and declared gaps;
9. returns map/table series only from the canonical response;
10. records no credential or private raw data in the pack trace.

The pack must not wait for a running Hub assessment. It returns `assessment_not_ready`; the caller retries after Hub completion.

### 10.3 Citation minimum

Each numeric citation includes:

- literal value and unit;
- assessment and AOI identity;
- scenario/RP;
- method key/version;
- relevant dataset versions/providers;
- classification/reason semantics;
- limitations and evidence-sharing status.

A final citable gaps entry lists missing vulnerability, source metadata or unsupported semantics. This permits honest limitations to pass the grounding gate.

## 11. Authentication and authorization

### 11.1 Browser users

Use a backend-for-frontend OIDC authorization-code flow with PKCE. The backend validates issuer, audience, signature, expiry, nonce and state, resolves membership, and issues a Secure, HttpOnly, SameSite cookie. Browser JavaScript does not retain access or refresh tokens.

Until OIDC is approved, staging may use named test accounts on restricted data. Production private data must not use the current quick-login or a shared human credential.

### 11.2 SIG-to-Hub service identity

Preferred production profile:

- OAuth 2.0 client credentials or workload federation from an approved issuer;
- short-lived JWT access token;
- audience fixed to the ADPC Hub API;
- scope `assessment:evidence:read` only;
- `sub` identifying the SIG Risk-pack workload;
- key rotation and revocation owned by named teams.

If user-delegated private evidence is required, adopt token exchange/on-behalf-of so the Hub can verify both user subject and acting SIG service. A token issued for the SIG MCP audience must never be forwarded to the Hub.

Controlled staging fallback, only for approved public fixtures: a high-entropy rotatable service token over TLS, stored as a SIG secret and verified as a hash at ADPC, combined with IP allowlisting and the same narrow endpoint. This is not the production identity design.

### 11.3 Authorization policy

The Hub checks:

- valid service audience/scope;
- enabled SIG integration client;
- assessment exists and succeeded;
- assessment belongs to the allowed Hub;
- evidence/publication policy permits the returned fields;
- delegated user membership when private evidence requires it.

The SIG VM’s ability to reach port 443 is connectivity, not authorization.

## 12. Privacy and publication

The current SIG receipt resolver is publicly reachable. Therefore:

- use only approved public/synthetic fixtures in the first end-to-end staging receipt;
- keep private assessment completion separate from evidence publication;
- require an explicit publication/evidence-sharing state before the evidence endpoint returns public-receipt content;
- exclude private centre names, raw geometries, user identities, storage links and internal traces unless separately approved;
- store who approved the exact representation and when;
- retain the private Hub result even when SIG is unavailable or publication is denied.

A receipt ID may be printed on an approved one-page summary only when the receipt’s visibility matches the summary’s audience.

## 13. Local developer workflow

### 13.1 Current prototype

Continue to run the release 0.10.1 prototype for UI reference:

```bash
cd prototype/github
node scripts/dev-local.js
# http://localhost:8080/?demo=planner
```

It remains fixture-backed and must not be mistaken for the new Hub service.

### 13.2 Production-shaped local stack

Develop the target service with a separate Compose project/profile containing API, worker and PostGIS. Use:

- synthetic Chiang Yuen fixture files;
- local migration and seed command;
- a mock SIG caller with a test service identity;
- a fake pack adapter for contract tests;
- no live SIG OAuth in ordinary unit tests.

Recommended commands to provide:

```bash
make dev-up
make migrate
make seed-golden
make test
make golden-test
make contract-test
make dev-down
```

The repository must document exact tool versions and include `.env.example` containing names only. Secrets remain ignored.

## 14. CI/CD and release flow

### 14.1 Pull request checks

- Python lint/type/unit tests.
- Migration forward test on an empty database.
- Golden GIS result test.
- V1–V3 negative tests.
- OpenAPI and SIG evidence-schema contract tests.
- Authorization matrix and cross-Hub denial tests.
- Dependency/container scanning.
- JavaScript syntax and existing prototype smoke checks.
- No-secret scan, including generated evidence captures.
- Docker image build pinned by digest.

### 14.2 Staging deployment

1. Merge reviewed code.
2. Build one immutable API/worker image.
3. Record image digest and migration version.
4. Back up staging state.
5. Deploy and run migrations as a one-off controlled task.
6. Run readiness, golden assessment and mock-SIG tests.
7. Run the enhanced live Risk pack against the approved public fixture.
8. Gate the draft, resolve the receipt and confirm exact IDs/linkage.
9. Test rollback and restore before production approval.

### 14.3 Production deployment

Use manual approval. Back up first, deploy the same tested image digest, migrate once, start one worker, and run non-destructive smoke tests. Do not automatically mint a public receipt during deployment. Rollback application code only when schema compatibility is proven; otherwise restore through the documented migration/recovery procedure.

## 15. Operations, monitoring and recovery

### 15.1 Health and metrics

- `/healthz`: process alive; no sensitive dependency detail.
- `/readyz`: database, storage and migration compatibility.
- Request count/error/latency by bounded route labels.
- Queue age, running duration, failed jobs, retries and stuck leases.
- Worker CPU/memory and raster read time.
- Disk capacity/inodes with warnings at 70% and critical at 85%.
- Database size/connections and backup age.
- SIG evidence calls by status/latency; never label metrics with assessment/user IDs.

Use structured JSON logs with `workflow_id`, `assessment_id`, safe `support_ref`, route and status. Redact authorization headers, cookies, tokens, raw uploaded features, signed URLs and draft/private evidence.

### 15.2 Backup

Back up PostgreSQL, accepted immutable files, method/configuration versions and SIG identifier mappings as a consistent set. Encrypt backups and copy them off the VM. Proposed initial policy pending ADPC approval:

- staging: daily, 7-day retention;
- production: daily full plus appropriate incremental/WAL strategy, 30-day operational retention;
- quarterly restore rehearsal;
- target RPO 24 hours and RTO 8 hours for MVP1, to be confirmed.

Replication or a second directory on the same disk is not backup.

### 15.3 Failure behaviour

- SIG unavailable: Hub jobs/results continue; evidence state is `pending_sig` or `sig_unavailable`.
- Hub unavailable: SIG returns a typed unavailable result; it must not fall back to generic place analysis for an `assessment_ref` request.
- Wrong/unsupported boundary: submission or pack assembly blocks.
- Raster/centre version missing or hash mismatch: job fails; no alternate input.
- Gate fails: no receipt; return failures for redrafting.
- Revoked access: deny subsequent result/evidence reads and cancel queued work where policy requires.

## 16. Capacity baseline

The GIS workload is CPU-bound. Start with one worker on each 4-vCPU VM. Reserve capacity for PostgreSQL, API and the OS. Measure:

- assessment wall time and CPU time;
- peak resident memory;
- COG bytes read and temporary disk;
- queue wait at one and two concurrent submissions;
- evidence endpoint and pack round-trip latency.

Production’s 32 GB RAM gives headroom, but it does not compensate for CPU saturation. Prefer 8 vCPU for production if available. Scale workers only after the golden result remains deterministic under concurrency and database/storage contention is measured.

## 17. Implementation increments and acceptance

### Increment 0 — VM and repository baseline

- Confirm DNS, IPs, Ubuntu version, SSH keys, firewall and off-VM backup target.
- Install Docker/Compose and host Caddy through an auditable bootstrap.
- Deploy the current prototype to staging with AI disabled and unmistakable fixture labels.
- Establish staging/production secret files and permissions.

**Accept:** HTTPS health works; only intended ports are exposed; no secret is in Git or image.

### Increment 1 — canonical golden assessment

- Create schema/migrations, local storage adapter and Chiang Yuen seed.
- Implement validation, job claim, worker and immutable result API.
- Add signed golden test and negative invariants.

**Accept:** REST assessment returns the signed expected result; unsupported geography and NoData fail correctly.

### Increment 2 — protected SIG evidence seam

- Implement evidence endpoint and service authorization.
- Add allowlist, audit, rate limit, correlation and contract tests.
- Test with mock SIG identity before live integration.

**Accept:** authorized fixture read succeeds; invalid audience/scope, cross-Hub and non-approved publication reads fail.

### Increment 3 — existing Risk-pack enhancement

- Add typed `assessment_ref` to the existing Risk contract.
- Implement allowlisted Hub resolution and evidence gathering.
- Emit exact citations/gaps and fail closed on target mismatch.

**Accept:** pack doctor passes; live pack numbers equal the golden Hub result exactly; no radius fallback is possible.

### Increment 4 — governed Planner evidence

- Assemble, draft with exact required sections, gate and mint one approved fixture receipt.
- Store pack/report/receipt IDs and draft hash linkage.
- Render receipt/evidence state separately from scientific approval.

**Accept:** receipt resolves and references the same assessment; privacy review approves its fields; SIG outage leaves Hub result intact.

### Increment 5 — pilot hardening

- Complete real OIDC/delegation, backup restore, operational alerts and runbooks.
- Perform authorization, load, failure and recovery tests.
- Enable production only after data/science and security sign-off.

**Accept:** release gates in the refined plan pass; AI remains disabled unless separately approved and metered.

## 18. Developer backlog order

1. Infrastructure confirmation checklist and threat model.
2. Architecture decision: FastAPI/PostGIS target accepted or revised.
3. Repository skeleton and local target Compose project.
4. Twelve migrations and Chiang Yuen seed.
5. Shared V1–V3 validation module.
6. Assessment API, database queue and worker.
7. Golden result and CI gate.
8. Immutable result and SIG evidence schemas.
9. SIG service authentication and authorization tests.
10. Existing Risk-pack `assessment_ref` schema proposal.
11. Minimal live pack enhancement.
12. Citation/gap and target-mismatch tests.
13. Planner status/evidence panel.
14. Receipt linkage and privacy review.
15. Backup/restore, load baseline and production runbook.

Each item should become team-estimated issues. Do not estimate pack deployment work until SIG names the repository, reviewer and deployment owner.

## 19. Open decisions and owners

| Decision | Proposed owner | Required by |
|---|---|---|
| Pack repository, review and deployment process | SIG pack owner | Increment 3 |
| `assessment_ref` final name/schema | SIG MCP owner + ADPC API owner | Increment 3 |
| SIG-to-Hub production credential profile | ADPC security/IT + SIG | Increment 2 |
| OIDC issuer, clients, audiences and delegation | ADPC IT + SIG | Pilot |
| Approved Chiang Yuen boundary source/edition | Scientific/data owner | Increment 1 |
| Signed golden centre classifications | Scientific owner | Increment 1 |
| Hazard raster vintage/version/licence | SIG catalog/data owner | Increment 3 |
| Vulnerability raster and metric | Scientific owner | Later slice |
| Public receipt/privacy policy | ADPC governance + SIG | Increment 4 |
| RPO/RTO and backup destination | ADPC IT/product | Increment 0 |
| SIG tool timeout/retry and receipt retention | SIG platform owner | Increment 3 |
| `compose_run` budget/visibility | SIG/product | Before AI |

## 20. Handoff checklist

A developer beginning now should:

1. Read the refined work plan and the three 14 September source documents.
2. Confirm local `main` versus `origin/main`; several validated MCP/handover commits may still be unpushed.
3. Keep the current Node prototype operational as a reference; do not present it as the target GIS service.
4. Confirm VM provisioning facts instead of assuming the request email proves DNS/firewall/account completion.
5. Start with local PostGIS, migrations, the golden seed and a mock SIG identity.
6. Do not call live `publish_answer` with private or incorrect-AOI data.
7. Keep `AI_FEATURE_ALLOWED=false` during infrastructure and evidence integration.
8. Record every architecture or contract change in this document and the repository handover.

The next demonstrable milestone is precise: an authorized, completed Chiang Yuen Hub assessment is read by the enhanced existing SIG Risk pack; every citation equals the signed golden result; the AOI is explicit; and no fallback, duplicate computation or private-data leak occurs.
