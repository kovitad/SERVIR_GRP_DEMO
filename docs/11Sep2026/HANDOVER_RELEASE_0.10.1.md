# GRP prototype release 0.10.1 handover

**Prepared:** 11 September 2026

**Repository:** `https://github.com/kovitad/SERVIR_GRP_DEMO.git`

**Branch:** `main`

**Deployable source of truth:** repository root, especially `public/` and `backend/`

## Delivered in this release

Release 0.10.1 integrates the MVP1 Hub data-and-run journey into the deployed Planner interface.

- Prepared evacuation-centre CSV/GeoJSON and flood TIFF/GeoTIFF upload, validation and persistent Hub catalogue.
- Exact source selection for boundary, flood, centres and vulnerability.
- Seven static return periods: RP10, RP20, RP50, RP75, RP100, RP200 and RP500.
- Persistent deterministic assessment results and Admin workflow traces.
- RP A/B comparison using one canonical backend response, including annual chances, comparable-centre transitions, all-seven-scenario progression, schematic synchronized maps, vulnerability overlap, attention table, evidence and limitations.
- A human data-preparation support route.
- Architecture alignment to the existing SIG `assemble_pack` extension through the proposed `grp-flood.gather(target, focus, trace, extras)` connector. The connector is not exposed as a new MCP tool and is not connected in this prototype.
- Admin staging rehearsal using the tester-confirmed inventory of 15 SIG tools while clearly separating user-confirmed staging evidence from local prototype execution.

All analytical values remain deterministic illustrative fixtures. The prototype does not execute production GIS, call the SIG MCP server, issue a SIG receipt, designate a safe shelter or provide a forecast.

## 11 September local fixes

Two localhost defects were identified and corrected:

1. **Compare crash:** the updated frontend was paired with an already-running older backend process, which returned a comparison without `insights.headline`. New comparison responses now include `schemaVersion: 2`; the frontend validates that contract and shows a clear restart/redeploy message instead of exposing a JavaScript property error.
2. **Main map height:** an unscoped `.map-canvas` rule intended for the 155 px schematic comparison maps also reduced the main Leaflet map. The rule is now scoped to `.comparison-map .map-canvas`.

The local development server now proxies `/healthz`, and the workflow CSS/JavaScript assets use the `0.10.1` cache key.

## Current local run

The application is available at:

```text
http://localhost:8080/?demo=planner
```

Start or restart it from the repository root after backend changes:

```bash
node scripts/dev-local.js
```

The Node backend is loaded at process start; editing backend files does not hot-reload them. Restart the local runner whenever `backend/server.js` or `backend/prototype-service.js` changes.

Health check:

```bash
curl http://localhost:8080/healthz
```

Expected fields include:

```json
{"status":"ok","prototypeApi":"ready","prototypeApiVersion":2}
```

## Validation completed

- Syntax checks passed for all frontend, backend and local-runner JavaScript.
- Python compilation and deployment-shell syntax checks passed.
- `docker compose config --quiet` passed.
- Both Docker images built successfully.
- Fresh browser test on `localhost:8080` passed with demo Planner access.
- RP100-to-RP500 comparison rendered one result, seven progression points and eight centre rows.
- A persistent assessment completed and displayed its full orchestration trace.
- Main Leaflet map retained its normal available height; only schematic comparison maps use 155 px.
- Browser console reported no errors and the tested journey had no failed network requests.

## Key implementation files

- `backend/prototype-service.js` — persistent prototype catalogue, upload, assessment, comparison, support and MCP-boundary fixtures.
- `backend/server.js` — authentication and routing into the protected prototype API.
- `public/workflow.js` — Planner data/run, upload, comparison and trace interactions.
- `public/workflow.css` — workflow and RP-comparison presentation.
- `public/app.js` — integration of stored assessment results into the existing Planner map.
- `public/observability.js` — Admin workflow trace and SIG staging rehearsal.
- `test-centres.csv` — valid centre-upload test fixture; CSV opens in Excel, while `.xlsx` upload is not supported.
- `docs/09Sep2026/` — MVP1 workflow implementation evidence.
- `docs/10Sep2026/` — architecture-alignment review and staging-rehearsal evidence.
- `docs/11Sep2026/` — RP-comparison evidence and this handover.

## Persistence and security boundaries

- `.env`, local logs, PID files, `storage/` and Python cache files are ignored and must not be committed.
- Uploaded data and prototype records persist under the configured feedback storage root (`prototype-db` locally; the `feedback_data` volume in Compose).
- Sessions and temporary Admin AI enablement reset after backend restart.
- Keep `AI_FEATURE_ALLOWED=false` unless a controlled HTTPS live-AI demonstration has been explicitly approved.
- Do not use HTTP to collect sensitive feedback, credentials or files outside the accepted local demonstration.

## Next actions

1. Push the release commit and confirm the GitHub Actions **Container check** passes.
2. Keep AI environment-locked for the first deployment and static workflow review.
3. Use DNS and HTTPS before collecting real feedback or enabling AI.
4. Replace deterministic assessment fixtures only after the GIS method and source contracts are approved.
5. Implement and test delegated authorization before connecting `grp-flood.gather(...)` to a protected Hub result.
6. Preserve the distinction between a working Hub REST prototype, proposed SIG integration and production scientific capability.
