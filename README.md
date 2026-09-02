# GRP Thailand Evacuation Preparedness Prototype

A bilingual planning prototype with a static Caddy frontend, persistent hub feedback collection and a restricted server-side Type B-lite OpenAI/Langfuse observability pilot, packaged for GitHub, Docker and Ubuntu AWS Lightsail.

## Thailand reference-experience login cover

Release 0.9.1 presents this deployment as one Thailand reference experience—not the single frontend every Hub must use. The desktop cover uses the supplied flood-planning artwork as a decorative layer, while essential context remains accessible HTML text. Mobile prioritises the login form and hides the nonessential artwork. See [`docs/02Sep2026/LOGIN_COVER_UPDATE.md`](docs/02Sep2026/LOGIN_COVER_UPDATE.md) for screenshots and the implementation summary.

## Role-based access

The application starts with a sign-in page backed by server-side sessions. Configure separate administrator and planner accounts in the ignored `.env` file:

- **Administrator** — enters the AI Assurance Dashboard, trace explorer and evaluation/review views, and can return to planning.
- **Planner** — enters the planning workspace, can request the controlled AI explanation and submit feedback, but does not receive the administrator trace/comparison/dashboard navigation.

Credentials are checked only by the Node.js backend and are never sent in frontend assets. Sessions use an HttpOnly, SameSite=Strict cookie, expire after eight hours and are held in memory for this controlled prototype. A backend restart signs everyone out. Use an approved identity provider and durable session store before broader or production use.

Set `DEMO_QUICK_LOGIN=true` to show **Continue as demo Planner** and support the shareable `/?demo=planner` link. The backend creates a Planner-only session without returning the configured password. There is deliberately no Admin quick-login endpoint; administrators must use private credentials.

## Hub feedback collection

Signed-in users can submit feedback containing a name, one of the six hub codes (EAP, TSA, SA, WA, ESA or CA) or Other, a category, text, an optional HTTP/HTTPS document link and one optional attachment up to 1 MB. Allowed attachments are PNG, JPG/JPEG, WebP and DOCX. The backend checks extension and file signature and stores files under generated names.

Feedback persists in the `feedback_data` Docker volume. Administrators can open **Feedback inbox**, update each submission to New, Reviewed, Follow-up or Closed, download attachments and export CSV. Planner accounts cannot list, manage or download other users' feedback.

Back up the volume before replacing the server. This low-volume file-backed store is suitable for the controlled prototype, not a replacement for an approved database, malware scanning, retention policy or records-management process.

## Personal API key and cost control

AI generation is now deny-by-default and protected by two independent controls:

1. **Environment master lock:** `AI_FEATURE_ALLOWED=false` prevents any administrator from enabling generation. Change it to `true` and restart only for a controlled demonstration.
2. **Admin runtime window:** after the restart, AI still starts OFF. Admin must open AI Assurance and enable a short window. The default window is 15 minutes with a global budget of five explanation attempts; it automatically switches off when either limit is reached.

The OpenAI and Langfuse keys remain only in the backend environment. They are never returned by the status, dashboard or Planner APIs. Planner responses also exclude admin trace metrics and Langfuse links. Explanation requests remain restricted to the fixed Phaya Thai/RP100/1 km contract and have per-account/IP rate limiting.

`AI_REQUIRE_HTTPS=true` allows local `127.0.0.1` testing but blocks AI generation over public HTTP. For the accepted temporary no-AI demonstration, `SITE_ADDRESS=:80`, `AI_REQUIRE_HTTPS=false` and `AI_FEATURE_ALLOWED=false` permit HTTP planning and feedback collection. Names, comments, links, attachments and session cookies are not encrypted over HTTP; configure DNS and Caddy automatic HTTPS before collecting sensitive material or enabling personal-token access.

Controlled enable/disable procedure:

```dotenv
AI_OBSERVABILITY_MODE=live
AI_FEATURE_ALLOWED=true
AI_RUNTIME_WINDOW_MINUTES=15
AI_RUNTIME_REQUEST_BUDGET=5
AI_REQUIRE_HTTPS=true
```

On AWS, use the deployment helpers rather than manually editing the master flag:

```bash
./scripts/ai-master.sh status
./scripts/ai-master.sh allow   # validates HTTPS/providers, recreates backend; runtime remains OFF
./scripts/ai-master.sh lock    # stops backend first, locks and recreates it
```

After `allow`, sign in as Admin and use **Enable 15 min · 5 requests**. Select **Disable now** when finished, then run `./scripts/ai-master.sh lock` for the safest shutdown. These commands never print or modify provider secret values.

Root or Docker-administrator access can inspect container environment variables. Move provider keys to an approved AWS secret store before broader production use, restrict `.env` file permissions, set provider-side spend limits and rotate the key if exposure is suspected.

## Workspace and overlay behaviour

Release 0.7.0 keeps one transient surface active at a time: opening an AOI menu, detail drawer or upload/report/export modal closes the others. Escape closes the active surface, and modal backdrops can be selected to dismiss them.

Use **Map only** in the map toolbar to hide chat, result cards, status and legend while preserving map navigation. Select **Exit map only** to restore the exact planning state. The Layers control minimizes or expands the map legend after an assessment.

## Product flow

The prototype supports any Thailand district or sub-district through mocked examples and presents two primary planning viewpoints:

1. **Where could people move?** Five candidate locations with nearby vulnerable-population zones and movement-planning information.
2. **Vulnerable people.** Aggregated indicators for assisted-movement planning.

Both viewpoints, together with shelter-proximity gaps, feed an editable **Preparedness investment brief** that provides strategic guidance for funding discussions. A red/yellow/green H/M/L risk map is available as supporting information.

> The AOI names are real examples. Boundaries, candidates, population values and analytical outputs are mocked. This is not an operational warning or shelter-designation system.

## Theme and languages

The interface uses the SERVIR Global Collaborative visual theme and logo. Use the **EN / TH** control in the header to switch the complete application between English and Thai. The selected language persists in the browser.

The interactive basemap uses **OpenStreetMap** through a locally hosted copy of **Leaflet 1.9.4**. It requires no API key. OpenStreetMap tiles are requested directly for this low-traffic prototype and include the required contributor attribution. AOI outlines, flood extents, candidates, vulnerability zones and risk results remain illustrative overlays—not authoritative map data.

### Step-by-step vulnerable-people map

The 26 August revision preserves this systematic journey and adds only one spatial feature first: selecting **Vulnerable people** displays four purple hatched aggregated zones (V1–V4). Selecting a zone opens its illustrative indicator and limitations. No individual or household locations are shown, and categories may overlap.

The broader automated shelter-proximity experiment remains archived under [`docs/26Aug2026/`](docs/26Aug2026/) for possible later incremental work.

## Type B-lite AI observability pilot

After completing **Phaya Thai · RP100**, select **Explain with AI**. The server-side workflow generates a real OpenAI explanation, runs four deterministic checks and three narrow AI judges, writes operations/generations/scores to Langfuse, and records planner helpful/not-helpful feedback. **AI assurance** opens the answer, trace, evaluation, comparison and dashboard views.

The live pilot accepts only the approved Phaya Thai/RP100/1 km contract. The GRP evidence and values remain illustrative. LangGraph is not part of this Type B-lite implementation. Comparison baseline and historical dashboard values are fixtures; the current answer, trace, usage, judges and feedback are live.

## Repository structure

```text
.
├── public/                    # Static application
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── i18n.js               # English/Thai localisation
│   ├── map-integration.js     # Leaflet map and planning overlays
│   ├── observability.js       # Live assurance interactions and five views
│   ├── observability.css      # Assurance workspace styling
│   ├── auth.js / auth.css     # Sign-in, session restoration and role-based UI
│   ├── feedback.js/.css       # Submission form and Admin feedback inbox
│   ├── vendor/leaflet/        # Locally hosted Leaflet 1.9.4
│   ├── assets/               # SERVIR brand assets
│   └── robots.txt
├── backend/
│   ├── server.js              # OpenAI workflow, checks, judges and Langfuse ingestion
│   └── Dockerfile             # Internal Node.js service
├── scripts/
│   ├── bootstrap-ubuntu.sh   # Install Docker and configure UFW
│   ├── deploy.sh             # Build, run and health-check
│   └── update.sh             # Pull and redeploy
├── .github/workflows/        # GitHub Actions container smoke test
├── HANDOVER.md               # Current state, deployment contract and continuation notes
├── Caddyfile                 # Static server, compression and security headers
├── Dockerfile
├── compose.yaml
└── .env.example
```

No external font, JavaScript or CSS CDN is required at runtime.

See [`HANDOVER.md`](HANDOVER.md) before continuing implementation or deploying a new revision.

## Administrator assurance dashboard

Release 0.6.0 includes an administrator-only demonstration dashboard built from the normalised `backend/data/langfuse-dashboard-2026-08-31.json` dataset. It represents six explanation traces from the 31 August Langfuse CSV export and excludes the preflight trace from operational KPIs. The dashboard provides:

- trace-level KPIs, evaluator distributions and explicit fail/unknown states;
- language and workflow-completeness filters;
- operation-level trace inspection;
- deterministic and AI-judge evaluation reasons;
- a prioritised human-review queue; and
- latency, tokens and estimated cost; and
- per-user authenticated requests, feedback, tokens, cost, average latency and last activity.

Historical traces created before login tracking are explicitly grouped as **Unattributed (pre-login export)**. New traces receive the authenticated username as a server-controlled Langfuse `userId`; runtime usage is in memory and resets with a backend restart.

This is visibly labelled as a **static export**, not live Langfuse monitoring. The next data stage is an approved Langfuse API ingestion process and durable analytics store.

## AI observability design

The 12-slide [`GRP_AI_Observability_and_Evaluation_Proposal.pptx`](docs/27Aug2026/GRP_AI_Observability_and_Evaluation_Proposal.pptx) provides the design basis. The implemented Type B-lite pilot uses OpenAI and Langfuse but manually orchestrates its narrow workflow in Node.js rather than using LangGraph. See the editable [`C1/C2 draw.io architecture`](docs/27Aug2026/architecture/SERVIR_GRP_Demo_C1_C2.drawio), the accompanying [architecture pictures and guide](docs/27Aug2026/architecture/README.md), and [`HANDOVER.md`](HANDOVER.md) for the exact live/fixture boundary and remaining governance work.

## Run locally

### Without Docker

Requires Node.js 22 or newer. The local runner reads the ignored `.env`, starts the backend, serves the frontend and proxies `/api/*` without exposing keys to the browser.

```bash
cp .env.example .env       # Skip if your configured .env already exists
node scripts/dev-local.js
```

Open `http://127.0.0.1:8080`. Press **Ctrl+C** to stop both services.

### With Docker

Requires Docker Engine with the Compose plugin.

```bash
cp .env.example .env
# Set ADMIN_USERNAME, ADMIN_PASSWORD, PLANNER_USERNAME and PLANNER_PASSWORD.
# Keep AI_OBSERVABILITY_MODE=mock for static review, or set live and populate
# server-side OpenAI/Langfuse credentials for the approved controlled pilot.
docker compose up -d --build
curl http://localhost/healthz
curl -c cookies.txt -H 'Content-Type: application/json' \
  -d '{"username":"YOUR_USERNAME","password":"YOUR_PASSWORD"}' \
  http://localhost/api/auth/login
curl -b cookies.txt http://localhost/api/observability/status
```

Open `http://localhost`. Stop with:

```bash
docker compose down
```

## Commit into your current GitHub repository

If this folder already sits inside your cloned repository:

```bash
cd prototype/github
git status
git add .
git commit -m "Add containerized GRP evacuation planning prototype"
git push origin HEAD
```

If `prototype/github` should become the root of a separate repository:

```bash
cd prototype/github
git init
git branch -M main
git add .
git commit -m "Initial containerized GRP prototype"
git remote add origin https://github.com/YOUR_ORG/YOUR_REPO.git
git push -u origin main
```

The included GitHub Action validates JavaScript, Compose, image build, health check and homepage response.

## Deploy to AWS Lightsail Ubuntu

### 1. Create the instance

Recommended starting point:

- Ubuntu 24.04 LTS
- At least 1 GB RAM
- Attach a Lightsail static IP
- In the Lightsail networking firewall, allow TCP 22, 80 and 443; allow UDP 443 for HTTP/3 if desired

### 2. Clone the repository

```bash
ssh ubuntu@YOUR_LIGHTSAIL_STATIC_IP
git clone https://github.com/YOUR_ORG/YOUR_REPO.git
cd YOUR_REPO
```

If these files are retained in a subfolder:

```bash
cd prototype/github
```

### 3. Verify/install Docker

The bootstrap script is safe to rerun. If Docker Engine and the Compose plugin already work, it skips Docker reinstallation and only verifies the installation, configures UFW and adds the SSH user to the `docker` group.

```bash
sudo ./scripts/bootstrap-ubuntu.sh
exit
```

Reconnect over SSH so the Docker-group change takes effect. Confirm:

```bash
docker --version
docker compose version
```

### 4. Configure the site

For IP-based HTTP testing:

```bash
cp .env.example .env
# Keep SITE_ADDRESS=:80
```

For automatic HTTPS with a domain:

1. Point the domain's A record to the Lightsail static IP.
2. Set `.env`:

```dotenv
SITE_ADDRESS=prototype.example.org
IMAGE_TAG=0.9.1
ADMIN_USERNAME=
ADMIN_PASSWORD=
PLANNER_USERNAME=
PLANNER_PASSWORD=
DEMO_QUICK_LOGIN=true
AI_OBSERVABILITY_MODE=mock
AI_FEATURE_ALLOWED=false
AI_REQUIRE_HTTPS=true
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.2
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_BASE_URL=https://cloud.langfuse.com
LANGFUSE_ENVIRONMENT=development
```

Caddy obtains and renews the TLS certificate automatically. Ports 80 and 443 must be publicly reachable.

### 5. Deploy

```bash
./scripts/deploy.sh
```

Check status:

```bash
docker compose ps
docker compose logs --tail=100
curl -I http://127.0.0.1/healthz
# Sign in through the application, or use the cookie-based example above before
# requesting the protected /api/observability/status endpoint.
```

### 6. Update later

For a normal code-only release, the ignored `.env` remains unchanged:

```bash
./scripts/update.sh
```

To upgrade an existing 0.8.0 Lightsail deployment, retain the existing ignored `.env` and run:

```bash
git pull --ff-only
python3 scripts/env_control.py migrate
python3 scripts/env_control.py status
python3 scripts/env_control.py validate
./scripts/update.sh
```

The migration adds `DEMO_QUICK_LOGIN=true` only if it is absent and does not display or alter passwords/provider keys. Compose creates the new persistent `feedback_data` volume automatically. `update.sh` performs another safe fast-forward check, migration and validation before rebuilding and restarting. Git never overwrites `.env` because it is ignored.

For AI on/off changes, do not rebuild the whole application and do not expose the key:

```bash
./scripts/ai-master.sh allow
# Admin opens the short runtime window in AI Assurance.
./scripts/ai-master.sh lock
```

## Operations

Common commands:

```bash
make health
make feedback-backup
make ai-status
make ai-allow
make ai-lock
make logs
make restart
docker compose stats
docker compose down
```

Caddy access logs are sent to container stdout. Docker rotates logs at 10 MB with three retained files.

Persistent Caddy certificate/configuration and feedback data are stored in named Docker volumes. Create a feedback archive after review sessions and copy it to approved storage outside the instance:

```bash
docker volume ls
./scripts/feedback-backup.sh
```

Do not run `docker compose down -v` during a normal update. It deletes the Caddy and feedback volumes.

## Maintenance workflow

- Treat `public/` and `backend/` as the deployable application sources in this GitHub package.
- Update `VERSION` and `CHANGELOG.md` for review milestones.
- Use feature branches and pull requests.
- Preserve visible `Illustrative`, missing-data and validation states.
- Never commit AWS credentials, personal data or operational facility/vulnerability records.
- Candidate places must not be described as officially safe without authority evidence.

## Production-readiness boundary

This Compose package is deployment-ready as a **controlled Type B-lite prototype**, not as an operational disaster-management service. It has role-based prototype accounts, in-memory sessions, a fixed scenario and basic in-memory rate limiting, but not production identity or durable quotas. A broader release still requires an approved identity provider and account lifecycle, durable sessions and authorization policy, approved cloud access/masking/retention, cost budgets, authoritative data adapters, evaluator calibration, privacy controls, monitoring, backup/recovery and approved scientific methods.
