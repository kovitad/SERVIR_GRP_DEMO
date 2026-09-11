# GRP MVP1 prototype architecture-alignment review

**Reviewed:** 10 September 2026

**Implementation reviewed:** `prototype/github/`
**Inputs:**

- `2026-09-07_GRP_MVP1_GRP_Developer_Architecture_Specification.docx`
- `this_is_current_mcp_staging_work_there.docx` and its five supplied staging captures

## Decision

**Yes—the prototype needed sharpening, mainly in how it described the SIG/MCP boundary.** The user workflow is directionally strong and already demonstrates most MVP product semantics, but the previous narrative made future `compute_run`, `contribute_submit`, and application-level `grp_*` aliases look like the intended critical path.

The architecture specification says the opposite:

1. Keep private data and domain execution in the Hub.
2. Keep one canonical Hub analytics/result service.
3. Reuse SIG's existing `assemble_pack` extension boundary.
4. Implement `grp-flood` as a domain-pack connector using `SPEC` plus `gather(target, focus, trace, extras)`.
5. Do not invent new `grp_*` MCP tools.
6. Do not wait for the declared `compute_run` and `contribute_submit` gaps to deliver MVP1.

The supplied staging evidence is also narrow but clear: Food Security demonstrates a connected evidence experience; Risk currently answers without data and follows a governed no-data/refusal path. The invited tester subsequently confirmed Google authentication and fresh-session enumeration of 15 SIG tools across discovery, evidence, retrieval and UI capabilities. This confirms server access and inventory, but it does **not** prove that a Risk connector, protected evidence transfer, or receipt integration exists.

## Changes made in the prototype

Release `0.10.1` sharpens the implementation without removing existing Planner capabilities:

- Reframed local APIs as **Hub-owned REST**, not rehearsals of missing MCP tools.
- Removed application `grp_*` aliases from the advertised MCP tool inventory.
- Advertised only documented existing SIG tools as non-live-tested contracts: `platform_capabilities`, `assemble_pack`, `verify_groundedness`, `record_receipt`, and optional `ui_embed`.
- Added the proposed `grp-flood.gather(...)` connector boundary and explicitly marked it **proposed—not connected** and **not an MCP tool**.
- Kept `compute_run` and `contribute_submit` visible, but marked them **not required for MVP1**.
- Reworked Planner and Admin traces to show:
  - working Hub REST and file-backed persistence;
  - deterministic Hub analytics fixture;
  - proposed SIG pack connector;
  - no upstream SIG call;
  - no SIG-issued pack, report, or receipt ID.
- Relabelled local receipt IDs as placeholders rather than upstream receipts.
- Updated README, handover, changelog, and version.
- Added **Determine evacuation-centre exposure** as the explicit Planner trigger; each click persists an assessment trace.
- Added an Admin **SIG MCP staging journey** rehearsal linked to the selected trace, with all 15 user-confirmed tools, execution truth, and a concrete developer-next action at every integration step.

## Alignment assessment

| Architecture requirement | Current prototype | Assessment |
|---|---|---|
| Hub owns local uploads, catalogue and execution | Actual upload, validation, save, selection, persistent result | Good prototype alignment |
| One canonical result across map/list/evidence | Planner and Admin consume one stored result | Good |
| Explicit Save → Select → Run | Implemented and visible | Good |
| Immutable assessment source snapshot | Dataset IDs, metadata and hashes are copied into assessment evidence | Good for demo; harden storage semantics |
| All centres classified once; counts reconcile | Deterministic centre records and three-way counts | Good fixture behavior |
| RP comparison holds non-hazard inputs fixed | Implemented | Good |
| Existing SIG pack-extension boundary | Now represented as `grp-flood.gather(...)` | Correct narrative; connector not implemented |
| No invented `grp_*` MCP tools | Removed from advertised tool list | Corrected |
| Exact SIG IDs only when issued | Local receipt now labelled placeholder | Corrected; avoid calling it a receipt in production APIs |
| Protected identity and delegation | Demo username/password sessions only | Major production gap |
| Protected evidence transfer/privacy gate | Not implemented | Major integration gap |
| Approved GIS method and golden results | Deterministic fixture only | Major scientific gap |
| Durable job attempts, leases, retry/cancel | File-backed queued/running/completed timer | Partial demonstration only |
| Optimistic concurrency for dataset current pointer | Confirmation exists; no ETag/`If-Match` | Gap |
| Idempotent assessment submission | Request key recorded but not enforced | Gap |
| Private canonical exports | Not implemented | Gap |
| Backup/restore and operational SLOs | Volume persistence and backup helper; no restore proof/SLO | Partial |

## Prioritised improvements

### P0 — before claiming a SIG-integrated demonstration

1. **Implement one real `grp-flood` connector slice.** SIG `assemble_pack` should invoke `gather(...)`, which calls a protected, allowlisted Hub result endpoint. Use public/golden fixture data first.
2. **Confirm the deployed SIG schemas.** Record the exact pack schema, `SPEC`, gather arguments/results, protocol version, timeouts, `platform_capabilities` response, and evidence privacy behavior. The supplied screenshots are not a contract test.
3. **Add identity/delegation spike.** Prove issuer, audience, user subject, acting SIG service, token exchange/on-behalf-of support, key rotation and revocation. Do not pass SIG-audience tokens to the Hub.
4. **Enforce resource authorization at the Hub API.** Check principal, hub, action, dataset version and result on list/read/export—not only role names.
5. **Add the evidence privacy gate.** If SIG cannot protect private pack/report/receipt storage and reads, return `blocked_privacy` and keep the permitted result local.
6. **Use SIG identities exactly.** Store `pack_id`, `report_id`, and `receipt_id` only after SIG issues them; keep local workflow IDs in separate fields.
7. **Approve the scientific method and golden cases.** Replace the mock centre classifications only after method, thresholds, NoData, precision, area, flood edition, vulnerability semantics and expected per-centre outcomes are approved.

### P1 — before named-user Beta

1. Replace demo login with OIDC BFF sessions using PKCE, nonce/state, secure cookies, CSRF/origin checks and mapped GRP membership.
2. Introduce true `DatasetSlot`/immutable `DatasetVersion` records and `If-Match` concurrency for Save/replacement.
3. Split upload initialization, quarantine transfer, checksum-bound completion and constrained parser validation.
4. Enforce `Idempotency-Key` for assessments; same key/same payload returns the same job and changed payload returns 409.
5. Add persisted `JobAttempt`, lease, retry classification, timeout, cancellation and terminal `succeeded/failed/cancelled` states.
6. Make comparisons consume two immutable assessment IDs rather than recomputing fixture sides inside the comparison route.
7. Add protected exports from the canonical result and retain the exact input manifest/method version.
8. Add safe structured API errors, bounded pagination, rate/quota handling and non-disclosing inaccessible-object behavior.
9. Test backup plus restore of database, immutable bytes and evidence mappings; define RPO/RTO and retention.
10. Add queue age, retry, outbox, disk, storage, validation-failure and stalled-job monitoring.

### P2 — scale only after measured need

- Durable outbox and authorised metadata federation.
- Shared transactional database when multiple API replicas require it.
- Object storage/spatial indexes as replaceable adapters.
- Second-Hub onboarding and explicit cross-Hub placement/conflict tests.
- Local MCP only if a validated use case requires it; it does not replace SIG governance.

## Recommended next vertical slice

Use one approved public fixture and demonstrate this exact path:

`Planner → protected Hub POST /assessments → durable succeeded result → SIG assemble_pack → grp-flood.gather(...) → protected Hub GET /result → cited pack → bounded answer → verify_groundedness → SIG-issued receipt`

Acceptance evidence should prove:

- REST and connector expose the same immutable result;
- every number has value, unit, source/version, method and limitation citation text;
- no raw private file path or token enters logs/traces;
- Risk no-data, Hub unavailable, unauthorized, timeout and `blocked_privacy` paths are explicit;
- grounding status is not presented as scientific approval.

## Bottom line

The prototype's **business workflow should be retained**. The principal correction is architectural truthfulness: it is a working Hub workflow with fixture analytics and a proposed existing-pack connector—not a suite of new GRP MCP tools and not a live SIG Risk integration. The remaining work is predominantly identity, authorization, connector contract proof, evidence privacy, durable execution and approved GIS science.
