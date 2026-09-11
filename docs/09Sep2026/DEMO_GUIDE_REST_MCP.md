# GRP Hub workflow + SIG pack-connector demo guide

## Start the prototype

From `prototype/github`:

```bash
docker compose up -d --build
```

Open <http://localhost/> and hard-refresh with **Ctrl+F5**. For the non-Docker development server, use `node scripts/dev-local.js` and open <http://127.0.0.1:8080/>.

Do not run `docker compose down -v`: the Docker volume contains uploaded demo data and assessment history.

## What to say before the demo

> This is a working Hub workflow prototype. File transfer, basic validation, local persistence and Hub REST endpoints work. Flood/GIS values are deterministic fixtures. The proposed SIG `grp-flood` pack connector and evidence calls are represented but not connected. The trace supports review but is not scientific approval and does not declare an evacuation centre safe.

## Ten-minute walkthrough

1. **Continue as demo planner.** Open **Data & run**.
2. **Make the request explicit.** Select **Phaya Thai District**, **RP100**, and one source for boundary, flood, centres and vulnerability.
3. **Show the prepared-data contract.** Open **Upload prepared data**. Explain that GRP does not guess columns, CRS, units or NoData meaning.
4. **Upload local data.** Upload `test-centres.csv`, validate it and save it. Show the confirmation that persistence does not automatically apply the data.
5. **Use My Hub data catalogue.** Select **Use in this assessment** and show the card changing from **Ready** to **Selected for next run**, plus the matching centre input selector above.
6. **Run once.** Start the assessment and show **queued → running → completed**.
7. **Review one canonical result.** Confirm the catalogue card now says **Applied to result**. Expected RP100 fixture: 8 centres; 3 potentially exposed; 3 not exposed under the scenario; 2 unable to assess.
8. **Compare return periods.** Compare RP100 with RP500 under **Compare flood scenarios**. Show paired counts and centre-status transitions. Explain that the flood layer changes while boundary, centres, vulnerability source and method remain fixed.
9. **Explain the integration boundary.** Hub REST owns the private workflow and canonical result. A future SIG `assemble_pack` call invokes `grp-flood.gather(...)`, which reads that authorised result instead of recalculating it. The connector shown is not live.
10. **Apply the result.** Apply it to the existing Planner map and show that the workflow returns to normal planning.
11. **Show the loop.** Reopen **Data & run**. The accepted local source is reusable. A replacement requires confirmation and a new run creates a new trace.
12. **Show assurance.** Sign out, use the configured Admin credentials, and open **AI assurance → Workflow traces**. Review operations, source snapshots, checksums, comparisons, centre reasons and the explicitly local receipt placeholder. No SIG pack/report/receipt ID has been issued.

## REST and MCP in business language

- **REST** is the doorway used by the GRP web application and conventional system integrations. For example, the browser sends `POST /api/v1/assessments` to start a run.
- **MCP** is SIG's standard tool doorway for authorised AI applications. For MVP1, retain SIG's existing `assemble_pack` extension rather than introducing application-level GRP tools.
- **AI orchestration** lets SIG select the approved domain pack. It does not own Hub permissions, private data, flood science or the canonical result.
- **The `grp-flood` connector** implements `SPEC` plus `gather(target, focus, trace, extras)` and reads an authorised Hub result. It does not calculate a second result.

## Link to the existing SIG pack boundary

The 10 September architecture review establishes that `compute_run` and `contribute_submit` are declared upstream gaps but **not MVP1 dependencies**. Local uploads remain in the Hub catalogue and flood execution remains behind the protected Hub assessment API.

| MVP1 operation | Owner and interface | Intended link |
|---|---|---|
| Upload → validate → save | Hub REST/catalogue | Keep private data in its owning Hub; no `contribute_submit` call is required. |
| POST assessment → queued/running/completed result | Hub REST/analytics | Run one approved method against pinned dataset versions; no `compute_run` call is required. |
| Read authorised result/source snapshot | `grp-flood.gather(...)` | Proposed connector behind existing SIG `assemble_pack`; returns citations, gaps and stats from the canonical result. |
| Draft verification and receipt | SIG `verify_groundedness` → `record_receipt` | Use only after protected evidence storage/read behavior is proven. |

The intended orchestration sequence is:

1. Prepare and complete the Hub assessment before pack assembly.
2. SIG selects the existing flood domain pack.
3. `assemble_pack` invokes `grp-flood.gather(target, focus, trace, extras)`.
4. The connector calls the protected, allowlisted Hub result API with valid delegated authorization.
5. The assistant drafts only from the returned pack.
6. `verify_groundedness` checks the bounded draft; this is not scientific approval.
7. `record_receipt` preserves the chain only when SIG actually issues the identifier and the privacy policy permits storage.

Do not expose new `grp_*` MCP tools. SIG and ADPC still need to confirm the real pack schema, connector contract, authentication/delegation, deadlines, evidence privacy and exact issued identifiers.

## Pre-demo checks

- [ ] Login and **Data & run** open without an error.
- [ ] `test-centres.csv` validates and can be saved.
- [ ] The saved source appears in **My Hub data catalogue**, can be explicitly selected, and changes to **Applied to result** only after a run.
- [ ] The saved Local source remains available after closing and reopening the workflow.
- [ ] RP100 completes with the expected 3 / 3 / 2 classification counts.
- [ ] RP comparison shows paired counts and centre-status transitions while boundary, centres, vulnerability and method remain fixed.
- [ ] The trace separates working Hub operations from the proposed, unconnected `grp-flood` and SIG evidence steps.
- [ ] Admin **Workflow traces** shows all operations, source records and eight centre records.
- [ ] The screen states that GIS is a fixture, Risk is not connected and the local receipt reference was not issued by SIG.

## Production work still required

1. Scientifically approved GIS raster/vector processing and reference results.
2. Live SIG `assemble_pack` → `grp-flood.gather(...)` integration plus user/service delegation and resource authorization.
3. Production database/object storage, tenancy, retention and audit controls.
4. Stronger geospatial validation, malware scanning and larger-file processing.
5. Production exports, retries, cancellation and broader failure-state coverage.
6. REST/connector canonical-result parity, privacy, security, load and scientific acceptance testing.
