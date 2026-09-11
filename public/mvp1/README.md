# GRP MVP 1 refinement prototype

Clickable, story-mapped UX mock based on the 04 September 2026 consolidated MVP 1 review baseline, extended on 07 September with an MCP alignment workshop layer.

## Purpose

Use this prototype in backlog refinement to review roles, workflow, terminology, data/provenance fields, required states, story boundaries and visible acceptance evidence.

It is not implementation evidence for OIDC, authorization, upload security, geospatial validation, deterministic calculations, persistence, exports, performance, audit integrity or recovery.

## Open locally

Run the existing local development server from the repository root:

```bash
node scripts/dev-local.js
```

Open:

```text
http://127.0.0.1:8080/mvp1/
```

Useful direct modes:

```text
/mvp1/?role=planner
/mvp1/?role=support#support
/mvp1/?role=unauthorized#signin
/mvp1/?state=upload-error#sources
/mvp1/?state=replace-error#sources
/mvp1/?state=vulnerability-error#results
/mvp1/?state=calculation-error#configure
/mvp1/?state=mcp-gap#results
/mvp1/?state=verification-error#results
/mvp1/?state=mcp-unavailable#results
/mvp1/?state=export-error#downloads
/mvp1/?role=developer#mcp
```

## Implemented refinement coverage

- Workshop role/scenario launcher
- MCP alignment capability map and proposed Hub–platform ownership flow
- Developer role and Jordan-training readiness checklist
- Simulated evidence pack, evidence tiers, explicit gaps and durable receipt
- MCP declared-gap, verification-failure and service-unavailable scenarios
- US-01/US-02 sign-in and non-revealing access-denied states
- US-03 upload and validation simulation, including a blocking CRS error
- US-04 save, replacement and failed-replacement behavior
- US-05 grouped platform/saved-local source catalog
- US-06 area, all seven JRC RP options and one-source-per-input configuration
- US-07 canonical center statuses, reconciled counts and controlled calculation failure
- US-08 normalized-index chart and vulnerability-unavailable state
- US-09 synchronized result map/list behavior and filters
- US-10 center reasons, provenance and explicit exclusions
- US-11 private one-page/map previews and export failure
- US-12 support lookup, diagnostic timeline and lean health/recovery view
- Story acceptance-criteria side panel distinguishing mock-review evidence from real implementation evidence

## Mock-data rules

All centralized sample content is in `mock-data.js`. Values are illustrative and must not become golden acceptance values. Items awaiting agreement are visibly marked TBC, proposed, unverified or illustrative.

## Recommended workshop route

1. Start with the platform-data happy path as Planner.
2. Review sign-in and data sources.
3. Simulate upload validation and saving.
4. Configure RP100 and run the assessment.
5. Review map/list/chart/source consistency.
6. Review both download previews.
7. Switch to Support and inspect the trace/recovery view.
8. Repeat with invalid upload, failed replacement, vulnerability unavailable, calculation failure, cross-Hub denial and export failure.
9. Assign every open decision an owner/date and mark each story Ready, Needs decision, Technical spike or Out of MVP.
