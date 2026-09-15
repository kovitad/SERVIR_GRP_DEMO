# Refined GRP MVP1 work plan after the 14 September live runs

**Status:** proposed delivery plan for team estimation and approval

**Prepared:** 14 September 2026

**Scope:** first credible Hub-owned flood assessment connected to the existing SIG evidence, gate and receipt platform

## Evidence used to refine this plan

This plan combines the current prototype and authenticated MCP capture with three new working documents:

- Parent-workspace source (not committed here): `prototype/14Sep2026/2026-09-14_GRP_MVP1_Live_Integration_Findings_v2.0.docx`
- Parent-workspace source (not committed here): `prototype/14Sep2026/2026-09-14_GRP_MVP1_Live_Run_Walkthrough_KuThong.docx`
- Parent-workspace source (not committed here): `prototype/14Sep2026/2026-09-14_GRP_MVP1_First_Slice_Technical_Design_v0.2.docx`
- [`sig-mcp-live-capture.json`](sig-mcp-live-capture.json)
- [`../10Sep2026/PROTOTYPE_ARCHITECTURE_ALIGNMENT_REVIEW.md`](../10Sep2026/PROTOTYPE_ARCHITECTURE_ALIGNMENT_REVIEW.md)

The technical design labels itself a proposal. Treat its deployment and technology choices as an approval gate, not as already accepted architecture.

## What the new evidence changes

The earlier plan began with proving a generic Risk pack and deferred the governed finish. The new runs have already gone further:

- Three generic Risk assemblies ran at tambon, district and province scales.
- The complete assemble → external draft → gate → receipt loop passed twice.
- Receipt `9655345712d3c364` exists for Ku Thong, but certifies a result computed over the wrong fallback area.
- Receipt `d5b98bc8302b1829` exists for Chiang Yuen District and used a resolved district boundary.
- Assembly took approximately 152 seconds for the Ku Thong fallback AOI and 52 seconds for Chiang Yuen District.
- Governance added roughly 20 milliseconds; GIS assembly, not the gate, dominates latency.
- The live Risk pack already carries `hazard_flood`, with lineage to ADPC and JRC GLOFAS v2.1.
- The live pack does not assess evacuation centres, does not include vulnerability weighting and does not meet the required three-status output.
- Tambon and province names silently fell back to an approximately 12 km radius box. A valid receipt therefore proves traceability, not correct place resolution or scientific correctness.

The next goal is no longer “prove MCP works.” It is “prove a Hub-owned canonical assessment can become SIG-citable evidence without changing area, data, method or identity.”

## Non-negotiable boundaries

1. The Hub owns users, memberships, private vector data, saved datasets, methods, jobs and canonical assessment results.
2. SIG owns its MCP endpoint, pack registry, groundedness gate, receipts and public receipt resolver.
3. Do not build a GRP MCP server for MVP1.
4. Do not build a parallel RAG/retrieval system. SIG’s gate resolves citations from SIG packs.
5. Do not duplicate stored pack or receipt content. Store identifiers and exact local linkage; resolve evidence from SIG.
6. “No extra cache” does not mean “no local result.” The immutable completed assessment row is the Hub result cache; the receipt is the governed evidence cache.
7. Every GIS assessment is an asynchronous job. No browser or MCP request should remain open for a 52–152 second computation.
8. A passed gate must never be presented as scientific approval or proof that the correct AOI was used.
9. No provider key or OAuth token may reach browser JavaScript, application traces, screenshots or Git.
10. Keep the current release available as an illustrative prototype while the production-shaped first slice is built. Do not silently replace its Phaya Thai fixtures with Chiang Yuen data.

## Delivery decision gate — before implementation

The product, backend, data and SIG owners should approve these points together:

- **Runtime:** accept or revise the proposed FastAPI worker/API plus PostGIS architecture instead of extending the current Node fixture backend.
- **Frontend:** retain the existing static/Caddy prototype during the first slice or approve a separate frontend migration. A Next.js migration is not required to prove the backend chain.
- **Pack ownership:** extend the existing Risk pack or add a neighbouring GRP pack. Avoid duplicating `hazard_flood`.
- **Pack deployment:** confirm whether ADPC may contribute a `packs_ext` module and who reviews/deploys it.
- **Network:** confirm whether the SIG VM may call the Hub’s protected HTTPS result endpoint.
- **First-slice geography:** use Chiang Yuen District for the golden integration because its boundary resolved in the live run; keep tambon/province unsupported until explicit geometry/admin-code targeting exists.
- **Identity:** approve the restricted interim service/delegation approach and assign the real OIDC decision.
- **Model path:** defer the Planner question box; when enabled, prefer the Hub-metered model path unless SIG provides auditable `compose_run` cost limits.

### Two hard blockers

The connector cannot be called viable until SIG answers:

1. Can ADPC extend/add a domain pack module, and what is the contribution/deployment process?
2. Can that pack make outbound HTTPS calls to the protected Hub result service?

A negative answer to either changes the connector architecture and must trigger replanning.

## First slice definition

One district, one boundary, one RP100 flood hazard, one evacuation-centre dataset, one approved method version, one queued assessment, one signed golden result, one pack integration and one resolvable receipt.

Explicitly defer:

- vulnerability-weighted output until an approved layer and meaning exist;
- two-return-period comparison in the production backend;
- browser upload in the production-shaped slice, even though the current prototype demonstrates it;
- free-text AI questions;
- additional hazards, hubs and real-time feeds;
- a new MCP server, vector contribution mechanism or private retrieval stack.

## Workstream 1 — approvals and measured contracts

**Owner:** product/architecture lead with SIG

### Tasks

- Hold one SIG technical session covering pack ownership/deployment and outbound access.
- Obtain the SIG tool-call deadline and expected retry/timeout behaviour.
- Ask whether a pack may accept an admin code or explicit geometry and cite Hub-held vector results.
- Confirm whether receipt IDs are durable production records and define retention/resolution expectations.
- Confirm who owns `compose_run` model spend, limits and usage reporting.
- Record raster publication date, version and licence ownership.

### Done when

- Decisions are written with owner/date.
- Both hard blockers have explicit answers.
- The target contract is approved or this plan is revised before connector code begins.

## Workstream 2 — golden science fixture

**Owner:** data/science owner

### Tasks

- Load an approved Chiang Yuen District boundary with source and edition.
- Load a small, versioned evacuation-centre fixture.
- Confirm the exact RP100 `hazard_flood` input and checksum.
- Hand-check the expected centre statuses and sign the golden output.
- Define the three mutually exclusive statuses and stable reason codes.
- Decide whether the hazard classes are provider bands or approved planning thresholds; do not relabel them as measured depth without approval.

### Done when

- Every in-scope centre has exactly one status.
- Status counts sum to the in-scope total.
- A signed golden fixture fails CI when geometry, method or expected output changes.
- No production correctness claim depends on the Ku Thong fallback-box receipt.

## Workstream 3 — Hub working-state foundation

**Owner:** backend team

### Proposed deployment

- `grp-api`: authentication, authorization, validation, enqueue, status and protected result API.
- `grp-worker`: geometry processing and invariant checks.
- `grp-db`: PostgreSQL/PostGIS, internal only.
- Caddy/nginx: HTTPS termination; only the API and frontend are public.

### Data model

Create migrations for:

- hub;
- app user;
- hub membership;
- boundary;
- dataset;
- append-only dataset version;
- feature;
- approved method/version;
- assessment/job;
- assessment feature/status;
- audit event;
- LLM usage.

The technical design also refers to `model_price` but does not include it in its stated twelve-table list. Resolve this before migration freeze: either make it a thirteenth table or keep versioned pricing in configuration for the first slice.

### Job contract

- `POST /assessments` validates authorization and queues in under one second.
- A worker claims with `FOR UPDATE SKIP LOCKED`.
- `GET /assessments/{id}` reports queued/running/completed/failed.
- `GET /assessments/{id}/result` returns the immutable authorised result and manifest.
- Duplicate boundary + hazard + RP + method version + dataset-version input resolves to the completed canonical assessment rather than recomputing.

### Validation

- V0: signed golden result in CI.
- V1: upload/import format, CRS, extent, fields, geometry, raster and NoData.
- V2: authorization, boundary, source selection, method approval and ownership before enqueue.
- V3: output invariants before persistence.
- V4: SIG groundedness gate after pack assembly; never substitute V4 for V0–V3.

### Done when

- A fresh VM can deploy from versioned configuration.
- A Chiang Yuen assessment runs asynchronously and matches the signed golden result.
- The protected result API returns no result across Hub/role boundaries.
- Failure codes are stable and shared by API, worker, support UI and tests.

## Workstream 4 — smallest possible SIG pack experiment

**Owner:** integration developer with SIG pack owner

Do this only after the two hard blockers are answered positively.

### Experiment

Create the smallest pack extension that:

1. Declares an explicit district/admin-code target rather than relying on free-text place fallback.
2. Calls the protected Hub result API over HTTPS.
3. Reads only an already-completed immutable assessment.
4. Returns one citation per result claim.
5. Adds a citable gaps entry.
6. Propagates assessment ID, dataset versions, method version and trace ID.
7. Runs the pack doctor/validation expected by SIG.

The pack holds no private source file and performs no second GIS calculation.

### Done when

- The pack reads the exact golden assessment.
- Citation numbers equal the Hub result exactly.
- The AOI identifier and geometry source are explicit in evidence.
- No radius fallback is possible without a blocking error.
- SIG can gate a draft and mint a receipt linked to that assessment.

If a custom pack cannot bypass the resolver, restrict MVP1 to the supported district target and raise the resolver change with SIG. Never silently use a fallback box.

## Workstream 5 — Planner integration

**Owner:** frontend/API team

### First UI increment

- Show canonical Hub assessment status/result.
- Show separate SIG state: not requested, assembling, available, failed or stale.
- Resolve a completed receipt rather than rerunning GIS for every page load.
- Render SIG’s receipt/evidence components where practical.
- Show pack ID, receipt ID, AOI source, method, dataset versions, gaps and timestamps.
- Label the current generic Risk receipts as external validation evidence, not Planner assessment receipts.

### Required warnings

- “Grounded” means claims trace to the recorded evidence; it does not verify source truth or scientific correctness.
- Missing evacuation-centre/vulnerability capability must be explicit until the custom pack closes it.
- Any radius fallback or unsupported administrative level is blocking, not informational.

### Done when

- Planner, table, map and download use one immutable Hub result.
- The displayed receipt resolves publicly and refers to the same assessment.
- SIG failure does not delete or corrupt the Hub result.
- No placeholder SIG identifier is styled as live.

## Workstream 6 — metered model path, deferred until evidence works

**Owner:** backend/governance team

- Keep AI disabled during first-slice integration.
- Route every later model call through one server-side gateway.
- Use one revocable provider key per Hub, mounted as a secret.
- Record Hub, user, assessment, purpose, provider/model, token counts, cost, latency, provider request ID, trace ID, receipt ID and status.
- Enforce per-request, per-user/day and per-Hub/month limits.
- Treat groundedness retries as a separate billable purpose.
- Reuse an existing answer/receipt for the same question and pack where policy permits.
- Do not use `compose_run` routinely until SIG exposes ownership, ceiling and usage visibility.

### Done when

- No model call can bypass the gateway.
- Usage rows reconcile with provider-reported token counts.
- Quota refusal is recorded and visible to Hub administrators.
- `publish_answer` receives an exact evidence-bound draft and stores real report/receipt identifiers.

## Suggested execution order

### Track A — start immediately

- Architecture decision gate.
- Signed Chiang Yuen golden fixture.
- Hub data model/migrations.
- Validation module and job lifecycle.
- Protected immutable result API.
- CI and deployment baseline.

### Track B — one urgent SIG conversation

- Pack ownership/deployment.
- Outbound HTTPS permission.
- Explicit target/admin-code support.
- Tool deadline and receipt retention.
- Raster metadata ownership and model-spend visibility.

### Track C — starts after blocker answers

- Minimal pack experiment.
- Exact result-to-citation test.
- Gate and receipt against the golden assessment.
- Planner receipt/evidence panel.

### Track D — after the evidence chain passes

- Approved vulnerability layer.
- Production browser upload.
- RP comparison.
- Metered question box and governed publication.
- Second geography/hub.

## Release gates

### Gate 1 — computation credible

- Signed golden test passes.
- V1–V3 failures tested intentionally.
- Correct district boundary and input manifests recorded.

### Gate 2 — connector credible

- SIG-hosted pack reads a protected completed Hub result.
- Exact numbers and trace IDs agree.
- No implicit AOI fallback.

### Gate 3 — governance credible

- Draft passes against the custom pack.
- Real report and receipt resolve.
- UI states the claim scope and gaps accurately.

### Gate 4 — pilot-ready

- HTTPS and real identity approved.
- Authorization isolation tested.
- Restore, audit and incident procedures rehearsed.
- Performance baseline and timeouts documented.
- AI remains off unless model budget controls are approved.

## Immediate next actions

1. Send SIG the two blocker questions and proposed minimal-pack experiment.
2. Ask the science owner for a signed Chiang Yuen golden result and approved boundary source/edition.
3. Decide whether the proposed FastAPI/PostGIS first slice is approved or whether the current Node service will be evolved instead.
4. Resolve the twelve-versus-thirteen-table `model_price` inconsistency.
5. Turn the approved architecture into team-estimated issues; do not treat this document’s ordering as a staffing estimate.
6. Push the existing three local commits after review so the live MCP evidence and handover are protected on `origin/main`.
