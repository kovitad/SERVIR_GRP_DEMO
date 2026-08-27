# GRP Thailand Evacuation Preparedness Prototype

A self-contained static review prototype packaged for GitHub, Docker and an Ubuntu AWS Lightsail instance.

## Product flow

The prototype supports any Thailand district or sub-district through mocked examples and presents two primary planning viewpoints:

1. **Where could people move?** Five candidate locations with nearby vulnerable-population zones and movement-planning information.
2. **Vulnerable people.** Aggregated indicators for assisted-movement planning.

Both viewpoints, together with shelter-proximity gaps, feed an editable **Preparedness investment brief** that provides strategic guidance for funding discussions. A red/yellow/green H/M/L risk map is available as supporting information.

> The AOI names are real examples. Boundaries, candidates, population values and analytical outputs are mocked. This is not an operational warning or shelter-designation system.

## Theme and languages

The interface uses the SERVIR Global Collaborative visual theme and logo. Use the **EN / TH** control in the header to switch the complete application between English and Thai. The selected language persists in the browser.

### Step-by-step vulnerable-people map

The 26 August revision preserves this systematic journey and adds only one spatial feature first: selecting **Vulnerable people** displays four purple hatched aggregated zones (V1–V4). Selecting a zone opens its illustrative indicator and limitations. No individual or household locations are shown, and categories may overlap.

The broader automated shelter-proximity experiment remains archived under [`docs/26Aug2026/`](docs/26Aug2026/) for possible later incremental work.

## Repository structure

```text
.
├── public/                    # Static application
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── i18n.js               # English/Thai localisation
│   ├── assets/               # SERVIR brand assets
│   └── robots.txt
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

## Run locally

Requirements: Docker Engine with the Compose plugin.

```bash
cp .env.example .env
docker compose up -d --build
curl http://localhost/healthz
```

Open `http://localhost`.

Stop the service:

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
IMAGE_TAG=0.1.0
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
```

### 6. Update later

```bash
./scripts/update.sh
```

## Operations

Common commands:

```bash
make health
make logs
make restart
docker compose stats
docker compose down
```

Caddy access logs are sent to container stdout. Docker rotates logs at 10 MB with three retained files.

Persistent Caddy certificate/configuration data is stored in named Docker volumes:

```bash
docker volume ls | grep caddy
```

Do not run `docker compose down -v` unless you intentionally want to remove certificate data.

## Maintenance workflow

- Treat `public/` as the deployable application source in this GitHub package.
- Update `VERSION` and `CHANGELOG.md` for review milestones.
- Use feature branches and pull requests.
- Preserve visible `Illustrative`, missing-data and validation states.
- Never commit AWS credentials, personal data or operational facility/vulnerability records.
- Candidate places must not be described as officially safe without authority evidence.

## Production-readiness boundary

This container is deployment-ready as a **static prototype**, not as an operational disaster-management service. A production release still requires authentication/authorization decisions, authoritative data adapters, audit storage, privacy controls, monitoring, backup/recovery and approved scientific methods.
