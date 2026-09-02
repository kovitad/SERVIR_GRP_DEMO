# AI / developer handover

**Last updated:** 2 September 2026
**Repository:** `https://github.com/kovitad/SERVIR_GRP_DEMO.git`  
**Branch:** `main`

## Current product state

The deployable prototype now consists of a Caddy frontend and a separate server-side Node.js API packaged with Docker Compose. It supports the Thailand evacuation-preparedness journey, a real interactive OpenStreetMap basemap, SERVIR branding, application-wide EN/TH switching and a live Type B-lite AI observability pilot.

The latest release is **0.9.0**. It adds optional one-click Planner-only demo access and persistent hub feedback collection with an Admin-only management inbox. AI generation is deny-by-default behind an environment master lock, starts runtime OFF after every restart, and can be enabled only by Admin for a short time/request-budget window. Public HTTP generation is blocked when `AI_REQUIRE_HTTPS=true`; local 127.0.0.1 testing remains available. The release also includes the 0.7.0 overlay/map-only UX and the 0.6.0 assurance dashboard/per-user usage.

It includes server-side sign-in for administrator and planner roles plus an administrator-only assurance dashboard based on the normalised 31 August Langfuse export. New live traces receive the authenticated username as server-controlled Langfuse `userId`, and the dashboard reports per-user requests, feedback, tokens, cost, average latency and last activity since backend start; historical pre-login traces remain unattributed. Administrators enter the dashboard, trace explorer and evaluation/review views. Planners enter the planning workspace and can use the controlled explanation/feedback flow only while Admin has opened an approved runtime window.

The pilot remains restricted to one question for Phaya Thai, RP100 and the 1 km threshold. When enabled, it generates a real OpenAI answer, records workflow operations and scores in Langfuse, and accepts planner helpful/not-helpful feedback. All underlying GRP evidence and analytical values remain illustrative.

## Current handover snapshot — what we are up to

- **Local state:** validated with Docker Desktop and running at `http://127.0.0.1` through Caddy and Docker Compose; both containers are healthy.
- **AI state now:** OFF and environment-locked because the ignored local `.env` has `AI_FEATURE_ALLOWED=false`. Planner sees **AI disabled by admin**; direct explanation attempts return HTTP 423 without calling OpenAI.
- **Admin control:** AI Assurance displays the environment lock, runtime state, automatic expiry and remaining global request budget. If the server master is allowed, Admin can enable 15 minutes / 5 requests by default and can disable immediately.
- **Transport state:** the accepted temporary demo uses `SITE_ADDRESS=:80` and permits HTTP while AI remains environment-locked. HTTP does not encrypt names, feedback, attachments, credentials or session cookies; use DNS/HTTPS before collecting sensitive content or enabling AI.
- **Authentication:** Admin and Planner roles use backend sessions; `DEMO_QUICK_LOGIN=true` permits one-click Planner access only, while Admin remains behind private credentials. Historical dashboard, feedback-management and AI-toggle APIs are Admin-only.
- **Hub feedback:** signed-in users can submit text, an HTTP/HTTPS document link or one validated 1 MB PNG/JPG/WebP/DOCX attachment. Feedback persists in the `feedback_data` Docker volume; Admin can review status, download attachments and export CSV.
- **Assurance dashboard:** six normalised historical Langfuse traces, evaluation distributions, trace detail, human-review queue and authenticated runtime usage.
- **Planning UX:** competing overlays auto-close, Escape/outside-click dismissal is supported, hidden planning information is inert, the restore control is in the toolbar, and Map only is reversible. Global dialogs now remain above all Leaflet/map controls, and flood-scenario evidence is a compact secondary information icon.
- **Deployment state:** packaged for Docker Compose/Lightsail but not yet deployed from this release. Backend port 3000 remains internal.
- **Persistence boundary:** hub feedback and attachments persist in the Docker `feedback_data` volume. Sessions, Admin AI enablement and per-user runtime aggregates reset on backend restart. Langfuse traces persist according to the configured project policy.

## Source of truth

Use these files for GitHub and deployment work:

- `public/index.html` — application markup and EN/TH control
- `public/styles.css` — application styles plus the 27 August SERVIR theme
- `public/app.js` — prototype interactions and generated planning content
- `public/i18n.js` — English/Thai runtime localisation, including dynamic DOM content
- `public/map-integration.js` — Leaflet setup, AOI navigation and map-bound planning overlays
- `public/observability.js` and `public/observability.css` — bilingual answer, trace, evaluation, comparison and dashboard experience
- `public/auth.js` and `public/auth.css` — login, Planner quick access, session restoration, sign-out and role-based UI
- `public/feedback.js` and `public/feedback.css` — feedback submission, upload progress and Admin inbox
- `backend/server.js` — authentication/session, persistent feedback and admin dashboard APIs plus restricted server-side OpenAI workflow, deterministic checks, narrow judges, Langfuse ingestion and feedback
- `backend/data/langfuse-dashboard-2026-08-31.json` — six normalised pilot traces from the static 31 August export; demonstration source, not live monitoring
- `backend/Dockerfile` — unprivileged Node.js backend image
- `public/vendor/leaflet/` — locally hosted Leaflet 1.9.4 JavaScript, CSS and marker assets
- `public/assets/servir-global-collaborative.png` — logo extracted from `prototype/27Aug2026/SERVIR Global Platform PoC.pptx` in the original workspace
- `Dockerfile`, `Caddyfile`, `compose.yaml` — frontend/backend container package and `/api/*` reverse proxy
- `scripts/dev-local.js` — zero-dependency local frontend/backend runner on `127.0.0.1:8080`
- `scripts/bootstrap-ubuntu.sh` — first-time Ubuntu/Lightsail setup
- `scripts/deploy.sh` — validate environment, initial build/deploy and health check
- `scripts/update.sh` — pull, migrate missing non-secret controls, validate environment, rebuild, restart and health check
- `scripts/feedback-backup.sh` — create a permission-restricted archive of the persistent feedback store
- `scripts/env_control.py` — secret-safe `.env` migration/validation and AI master-state updates
- `scripts/ai-master.sh` — AWS operator commands for AI status/allow/lock without displaying or changing provider keys

The parent workspace also has copies under `prototype/`, but **`prototype/github/public/` is the deployable GitHub source of truth**. Synchronise intentionally if work begins in the parent prototype.

## Docker and AWS Lightsail contract

- Frontend base image: `caddy:2.8.4-alpine`; backend base image: `node:22-alpine`
- Public ports: TCP 80/443 and UDP 443; backend port 3000 is internal only
- Runtime limit: 256 MB memory and 1 CPU per service in Compose
- Restart policy: `unless-stopped`
- Application health endpoint: `/healthz`
- Real basemap: public OpenStreetMap standard tiles for low-traffic prototype use; no API key
- Required attribution is displayed by Leaflet
- Caddy CSP explicitly permits map images from `https://tile.openstreetmap.org`
- Container health check verifies `http://127.0.0.1/healthz`
- Persistent Caddy data/config and hub feedback use named Docker volumes (`caddy_data`, `caddy_config`, `feedback_data`)
- `.env.example` defaults to `SITE_ADDRESS=:80`, `DEMO_QUICK_LOGIN=true`, `AI_OBSERVABILITY_MODE=mock`, `AI_FEATURE_ALLOWED=false` and `AI_REQUIRE_HTTPS=false` for the accepted temporary HTTP/no-AI demo; both roles require populated account variables; live provider configuration alone cannot enable generation without the environment lock and Admin runtime window
- Set `SITE_ADDRESS=your.domain.example` after DNS points to the Lightsail static IP for Caddy automatic HTTPS

Lightsail also needs ports 22, 80 and 443 enabled in its networking firewall. The bootstrap script configures the matching Ubuntu UFW rules and installs Docker Engine plus the Compose plugin.

## Deployment commands

First deployment on Ubuntu 24.04:

```bash
git clone https://github.com/kovitad/SERVIR_GRP_DEMO.git
cd SERVIR_GRP_DEMO
sudo ./scripts/bootstrap-ubuntu.sh
# Reconnect SSH if the script added the user to the docker group.
cp .env.example .env
# Edit SITE_ADDRESS if a DNS hostname is ready.
# For the approved live pilot, set AI_OBSERVABILITY_MODE=live and populate
# OPENAI_API_KEY, OPENAI_MODEL, LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY,
# LANGFUSE_BASE_URL and LANGFUSE_ENVIRONMENT in .env or an approved secret store.
./scripts/deploy.sh
curl -f http://127.0.0.1/healthz
```

### Upgrade the existing AWS/Lightsail Docker deployment from 0.8.0

The server already has Docker and an existing ignored `.env`. Do not replace that file because it may contain private Admin credentials or provider settings.

```bash
cd SERVIR_GRP_DEMO

git pull --ff-only

# The new script adds DEMO_QUICK_LOGIN=true only when the setting is absent.
# It never prints or changes account passwords or provider keys.
python3 scripts/env_control.py migrate
python3 scripts/env_control.py status
python3 scripts/env_control.py validate

./scripts/update.sh
curl -f http://127.0.0.1/healthz
docker compose ps
```

Compose automatically creates the new persistent `feedback_data` volume during `update.sh`. Existing Caddy volumes are retained. The backend restarts, so existing login sessions and temporary AI runtime state reset; stored feedback survives subsequent rebuilds/restarts.

Verify after upgrade:

1. Open `http://LIGHTSAIL_STATIC_IP/?demo=planner` and confirm one-click Planner access.
2. Submit one temporary text feedback item.
3. Sign out, sign in with the private Admin account and open **Feedback inbox**.
4. Change its status and export CSV.
5. Create the first backup with `./scripts/feedback-backup.sh`.

For subsequent normal code deployments:

```bash
cd SERVIR_GRP_DEMO
./scripts/update.sh
```

`update.sh` now runs the safe environment migration before validation. It preserves existing values and only supplies missing non-secret release controls.

Back up hub feedback after meaningful review sessions:

```bash
./scripts/feedback-backup.sh
# Copy backups/grp-feedback-*.tgz to approved storage outside the instance.
```

Never run `docker compose down -v` during a normal update; `-v` deletes feedback and Caddy volumes.

AI master control does not require a full application rebuild:

```bash
./scripts/ai-master.sh status
./scripts/ai-master.sh allow  # requires live providers + DNS/HTTPS; runtime remains OFF
./scripts/ai-master.sh lock   # stops backend first, locks, then recreates it
```

## Validation completed

- `node --check` for frontend JavaScript, `backend/server.js` and `scripts/dev-local.js`
- Local runner smoke test confirmed the homepage and live backend status through `127.0.0.1:8080`
- `docker compose config --quiet`
- Docker Desktop image build and healthy-container startup for release 0.9.0
- API and browser validation of Planner quick login, text feedback, PNG/DOCX validation, the 1 MB limit, Admin isolation, status updates, CSV export and restart persistence
- OpenAI model-access and Responses API preflight succeeded for `gpt-5.2`
- Langfuse authentication and ingestion preflight succeeded
- Live English and Thai pilot requests generated OpenAI answers and real Langfuse traces
- Four deterministic checks and three narrow judges were returned; an observed `unknown` judge result was preserved rather than forced to pass
- Planner helpful feedback was successfully written to Langfuse
- Browser validation covered the complete assessment → explanation → trace/evaluation/comparison/dashboard journey, EN/TH switching, and zero browser-console errors
- Browser evidence is stored under `docs/27Aug2026/screenshots/`
- Browser validation of EN/TH switching, persistence, dynamic assistant output, the SERVIR theme and result layout
- Browser validation of OpenStreetMap loading, AOI fly-to, zoom/pan and illustrative Leaflet overlays
- GitHub Actions now validates frontend/backend JavaScript, builds both Compose images, checks frontend health and the backend status route, and requests required assets

Docker Desktop was available for the 0.9.0 implementation. Both images built successfully, containers became healthy, and local API/browser tests covered Planner quick access, feedback submission, Admin isolation, status changes, CSV export and persistence across a backend restart.

## Important implementation notes

1. Authentication uses eight-hour in-memory sessions with an HttpOnly, SameSite=Strict cookie and login throttling. One-click demo access is Planner-only and controlled by `DEMO_QUICK_LOGIN`; Admin has no quick-login endpoint and retains private credential access. Backend restarts sign users out. Use an approved identity provider, password hashing, durable sessions and formal account lifecycle controls before broader use.
2. Hub feedback is a low-volume file-backed prototype service. Back up the `feedback_data` volume and introduce an approved database, malware scanning, retention/deletion policy and records controls before broader collection.
3. `i18n.js` translates initial and dynamically inserted DOM text with a `MutationObserver`. Add new English UI phrases to its exact dictionary or ordered fragment list whenever user-facing content is added.
4. Preserve technical identifiers such as AOI, RP20/RP50/RP100, CRS, GeoJSON and H/M/L where appropriate.
5. The prototype displays real AOI names but mocked boundaries, candidates, population and analytical results. Do not weaken these limitations.
6. No individual or household locations are displayed. Vulnerability categories can overlap and must not be summed.
7. Low/green risk does not mean safe, and candidate locations are not approved shelters.
8. The OpenStreetMap basemap is real, but the AOI outline and all analytical overlays remain mocked. Public OSM tiles are appropriate only for this limited prototype; move to a managed or self-hosted provider before significant public traffic.
9. Provider credentials exist only in ignored local `.env` or an approved deployment secret store. Never expose them through frontend JavaScript, screenshots, logs or Git.
10. The backend accepts only Phaya Thai, RP100 and 1 km. It applies per-account/IP rate limiting plus an Admin-controlled global time/request budget. These are controlled-demo cost protections—not durable production quota enforcement or abuse prevention.
11. The comparison baseline and historical dashboard values are demonstration fixtures. The current run, OpenAI usage, evaluator results, trace and feedback are live. Do not describe Screen 4 as a completed controlled Langfuse experiment.
12. Cost is an application estimate using configured GPT-5.2 token rates; provider billing and Langfuse model pricing are authoritative.

## AI observability and evaluation — implemented Type B-lite pilot

The 27 August proposal has now moved from a Type A mock to a working Type B-lite pilot. The reviewed design artifacts remain:

- `docs/27Aug2026/GRP_AI_Observability_and_Evaluation_Proposal.pptx`
- `docs/27Aug2026/create_ai_observability_presentation.py`
- `docs/27Aug2026/AI_OBSERVABILITY_VISUAL_MOCK_PLAN.md` — original visual plan; implementation now exceeds its Type A boundary
- `docs/27Aug2026/screenshots/` — browser evidence for the implemented screens
- `docs/27Aug2026/architecture/SERVIR_GRP_Demo_C1_C2.drawio` — editable two-page C1/C2 architecture
- `docs/27Aug2026/architecture/SERVIR_GRP_Demo_C1.png` and `SERVIR_GRP_Demo_C2.png` — architecture pictures

The in-scope question is:

> Why should areas farther than 1 km from candidate shelters be prioritised?

### What is live

1. After completing Phaya Thai RP100, the planner selects **Explain with AI**.
2. The browser submits only the approved AOI, scenario, 1 km threshold, language and an ephemeral session ID to `/api/observability/explain`.
3. The Node backend validates the fixed pilot contract, loads three versioned illustrative evidence records and reads the deterministic 18,640 / 11,240 values.
4. OpenAI `gpt-5.2` generates an English or Thai planning explanation with evidence IDs and human-review wording.
5. Four deterministic checks run for figures, evidence/version resolution, schema and mandatory limitations.
6. Three separate OpenAI judges assess groundedness, question relevance and action usefulness as `pass`, `fail` or `unknown`.
7. Langfuse receives the root trace, validation/retrieval/calculation spans, answer and judge generations, evaluation span, token usage and evaluator scores.
8. The response supplies the exact Langfuse trace link. Planner 👍/👎 feedback is written back as `human.planner_feedback`.

The application includes five bilingual views: planning explanation, live trace detail, evaluator results, baseline/current comparison and assurance dashboard. The **AI assurance** header entry reopens these views without resetting the planning assessment.

### Important implementation boundaries

- The workflow is manually orchestrated in the Node backend; **LangGraph is not yet installed or used**. This is intentional Type B-lite scope and must not be represented as a LangGraph implementation.
- The current trace and evaluator calls are live. The comparison baseline and historical dashboard values are fixtures, not a completed offline experiment.
- The three evidence records and all GRP values remain illustrative. Real tracing does not make the underlying science operationally valid.
- Human calibration with 10–20 labelled cases has not been completed. Judge scores are diagnostic pilot outputs, not release authority.
- Langfuse access, masking and retention settings still require an accountable owner review.
- The endpoint has role-based prototype authentication, a fixed-scenario contract and basic in-memory rate limiting, but no production identity provider, durable session/quota, queue or distributed rate limiter.

## Type B-lite operational handover

### Environment contract

Set these only in an ignored `.env` file or approved deployment secret store:

- `AI_OBSERVABILITY_MODE=live`
- `AI_FEATURE_ALLOWED=false` by default; set `true` and restart only for a controlled live demo
- `AI_RUNTIME_WINDOW_MINUTES=15`
- `AI_RUNTIME_REQUEST_BUDGET=5`
- `AI_REQUIRE_HTTPS=true`
- `OPENAI_API_KEY`
- `OPENAI_MODEL=gpt-5.2`
- `LANGFUSE_PUBLIC_KEY`
- `LANGFUSE_SECRET_KEY`
- `LANGFUSE_BASE_URL`
- `LANGFUSE_ENVIRONMENT`

Use `AI_OBSERVABILITY_MODE=mock` when credentials or cloud approval are unavailable. In mock mode, status remains visible but live explanation requests are rejected rather than silently simulated.

### Demonstration flow

1. Keep `AI_FEATURE_ALLOWED=false` during preparation and demonstrate the historical Admin dashboard without provider cost.
2. For a controlled live step, configure HTTPS, set `AI_FEATURE_ALLOWED=true`, restart, sign in as Admin and enable the short runtime window.
3. Sign in as Planner and select **Review preparedness**.
4. Select **Phaya Thai District, Bangkok**.
5. Keep RP100 and run the assessment.
6. Select **Explain with AI** and inspect the answer, evidence and limitations.
7. As Admin, open Trace detail and follow validation → retrieval → deterministic result → answer generation → three judge generations → evaluation.
8. Open Evaluation and retain `unknown` results for review; never force an all-green demonstration.
9. Open the real trace in Langfuse and confirm observations and scores.
10. Submit helpful/not-helpful feedback and verify `human.planner_feedback` in Langfuse.
11. Select **Disable now**, return `AI_FEATURE_ALLOWED=false`, restart and confirm Planner shows AI disabled.
12. Review Compare and Dashboard with the fixture/live distinction stated above.

### Remaining work before broader use

1. Name the technical owner, product acceptance owner, scientific evidence owner and human-labeling participants.
2. Review and approve Langfuse Cloud region, access, masking and retention.
3. Create 10–20 human-labelled calibration cases with pass, fail and unknown examples.
4. Run a real Langfuse baseline/candidate experiment; replace the Screen 4 fixture only after reproducible results exist.
5. Replace prototype accounts with an approved identity provider and durable sessions, quotas and cost budgets before exposing the live endpoint beyond a controlled review group.
6. Replace illustrative evidence with approved sources and methods before any operational claim.
7. Decide whether LangGraph adds enough workflow value to justify introducing it; do not add it only to match the proposal diagram.

## Recommended next checks

1. Push the committed release and confirm GitHub Actions **Container check** builds both images and passes the locked-AI smoke test.
2. Before AWS deployment, point DNS to the Lightsail static IP and set `SITE_ADDRESS=your.domain.example` so Caddy provides HTTPS. Use `scripts/env_control.py validate` before deployment and `scripts/ai-master.sh` rather than hand-editing the AI master for each demo.
3. Keep `AI_FEATURE_ALLOWED=false` for the first static dashboard/planning demonstration.
4. Store approved provider secrets on the server or in AWS Secrets Manager, never in Git; verify `.env` permissions and provider-side spend limits.
5. Run `./scripts/deploy.sh`, verify `docker compose ps`, confirm port 3000 is not public and test Admin/Planner access over HTTPS.
6. If a controlled live step is approved, enable the environment master, restart, open the Admin runtime window and run one English and one Thai explanation.
7. Confirm exact traces, evaluator scores, authenticated `userId` and feedback in Langfuse, then disable both runtime and environment master controls.
8. Complete owner, cloud-governance and evaluator-calibration decisions before calling the pilot accepted.
