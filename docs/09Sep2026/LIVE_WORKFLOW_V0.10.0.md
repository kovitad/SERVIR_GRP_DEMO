# GRP MVP 1 v0.7 live workflow implementation

**Prototype release:** 0.10.1

**Requirement baseline:** `2026-09-09_GRP_MVP1_Complete_Development_Proposal_v0.7.docx`
**Status:** Clickable Hub implementation using persistent uploads and static result fixtures, with an explicitly proposed—not connected—SIG pack connector

## What can be reviewed

1. Sign in or continue as demo Planner.
2. Open **Data & run** from the existing Planner map workspace.
3. Select one of the three prototype areas and RP10, RP20, RP50, RP75, RP100, RP200 or RP500.
4. Select exactly one boundary, flood, evacuation-centre and vulnerability source.
5. Open **Upload prepared data** and upload a centre CSV/GeoJSON or flood TIFF/GeoTIFF.
6. Review validation errors or save an accepted file to the persistent Hub catalogue.
7. Select the saved local source and run the assessment.
8. Observe queued, running and completed states.
9. Review matching static values, source records, working Hub events and proposed SIG connector/evidence events.
10. Apply the stored result to the existing Planner map.
11. Use **Need help preparing your data?** to record a safe human-support request.
12. As Admin, open **Data support** from the Planner header to review stored requests.

## Honest simulation boundary

- Files are genuinely transferred to the Node backend and accepted files are persisted under the existing Docker storage volume.
- CSV/GeoJSON centre validation checks required IDs and point coordinates.
- TIFF validation checks the file signature and required declared raster metadata; it is not a production GeoTIFF/GIS parser.
- Assessments, source snapshots, support requests and traceability IDs are persisted in a small file-backed JSON development database.
- Assessment values are deterministic static fixtures selected by return period.
- REST endpoints are functional prototype APIs.
- The Hub owns the canonical result. `grp-flood.gather(...)` is represented as the proposed extension behind existing SIG `assemble_pack`; it is not connected and is not exposed as a new MCP tool.
- `compute_run` and `contribute_submit` remain visible upstream gaps but are not MVP1 dependencies.
- No live SIG Risk connector, real JRC service or production GIS calculation is called.
- Local receipt references are placeholders, not SIG-issued IDs, and do not establish grounding, scientific approval or centre safety.

## 10 September architecture clarification

Read [`../10Sep2026/PROTOTYPE_ARCHITECTURE_ALIGNMENT_REVIEW.md`](../10Sep2026/PROTOTYPE_ARCHITECTURE_ALIGNMENT_REVIEW.md). It supersedes the earlier idea that application-level `grp_*` aliases or the missing compute/contribute bones form the MVP critical path. The product journey remains valid; the corrected integration is Hub REST/analytics → `grp-flood.gather(...)` → existing SIG pack/evidence services.

## Final consolidated reference

Use `prototype/09Sep2026/final/` as the current handoff folder:

- `GRP_MVP1_Business_to_Technical_Final_v1.2.pptx` — presentation reference with the visible Hub catalogue/application journey
- `GRP_MVP1_Business_to_Technical_Final_v1.2.docx` — complete baseline-first requirements and implementation reference
- `GRP_MVP1_Outcome_to_Implementation_v1.0.drawio` — seven-page editable architecture source

## Demo material

- [`DEMO_GUIDE_REST_MCP.md`](DEMO_GUIDE_REST_MCP.md) — repeatable business walkthrough, plain-language REST/MCP explanation and pre-demo checklist
- `prototype/09Sep2026/GRP_MCP_Business_Concept_and_Sprint_Proposal_v1.4.pptx` — complete 44-slide business deck retaining RP comparison and moving from outcome into orchestration, services, assurance and delivery
- `prototype/09Sep2026/2026-09-09_GRP_MVP1_Requirements_Review_Pack_v0.6.docx` — capability-reconciled requirements pack with progressive visual views and live Planner/Admin evidence
- `prototype/09Sep2026/2026-09-09_GRP_MVP1_Complete_Development_Proposal_v0.8.docx` — refined complete backlog, role model, proposed bone contracts, eight-record backlog delta and Definition of Done

## Review captures

- [`live-data-and-run.png`](live-data-and-run.png) — integrated source and scenario configuration
- [`live-prepared-upload.png`](live-prepared-upload.png) — prepared-file contract and actual browser upload
- [`live-upload-saved.png`](live-upload-saved.png) — validated source persisted to the Hub catalogue
- [`upload-saved-next-step.png`](upload-saved-next-step.png) — save confirmation explaining that persistence and application are separate actions
- [`my-hub-data-catalog.png`](my-hub-data-catalog.png) — empty/ready catalogue location in Data & run
- [`my-hub-data-selected.png`](my-hub-data-selected.png) — saved source explicitly selected for the matching assessment input
- [`my-hub-data-applied.png`](my-hub-data-applied.png) — completed result showing the catalogue source frozen into assessment evidence
- [`admin-hub-data-catalog.png`](admin-hub-data-catalog.png) — Admin view of current/replaced dataset versions and assessment usage
- [`live-rest-mcp-trace.png`](live-rest-mcp-trace.png) — canonical result and simulated REST/MCP traceability
- [`live-result-applied.png`](live-result-applied.png) — stored result applied to the existing Planner map and chat
- [`admin-full-workflow-trace.png`](admin-full-workflow-trace.png) — Admin workflow trace explorer with canonical counts and full stored evidence chain
- [`planner-servir-bone-alignment.png`](planner-servir-bone-alignment.png) — Planner view of visible `contribute_submit` and `compute_run` gaps and proposed loop
- [`planner-rp-comparison.png`](planner-rp-comparison.png) — retained RP comparison with paired counts, centre transitions and held-constant vulnerability context
- [`admin-rp-comparison.png`](admin-rp-comparison.png) — Admin assurance inventory of persisted scenario comparisons
- [`admin-servir-bone-alignment.png`](admin-servir-bone-alignment.png) — Admin governance view of both declared gaps and the complete run history
- [`admin-service-call-matrix.png`](admin-service-call-matrix.png) — call-by-call Admin view of caller, contract, invoked service, execution truth, upstream status and input/output summary

## Enabled prepared-data contracts

### Evacuation centres

- CSV: `center_id`, `name`, `latitude`, `longitude`
- GeoJSON: Point `FeatureCollection` with unique `properties.center_id`

### Flood hazard

- `.tif` or `.tiff` with TIFF signature
- declared CRS
- depth units in metres
- declared NoData meaning
- one supported return period

Maximum prototype upload size: 5 MB. Automatic conversion, CRS/column guessing, geometry repair and scientific certification are excluded.
