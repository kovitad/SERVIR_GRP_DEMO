# GRP Thailand Flood Evacuation Proximity Planning Prototype

A self-contained static review prototype packaged for GitHub, Docker and an Ubuntu AWS Lightsail instance.

## Product flow

The prototype supports Thailand district or Tambon examples and provides three connected automated spatial-planning views:

1. **People & vulnerability** — aggregated population-density and vulnerable-population cells.
2. **Shelter proximity** — candidate shelters, selectable thresholds and nearest-shelter straight-line distance.
3. **Planning gaps** — areas outside the threshold and automated preparedness strategy guidance.

> AOI names are real examples. Boundaries, cells, shelters, distances and results are mocked. Proximity is not capacity coverage, route safety or official shelter assessment.

Pin's 26 August refinement brief, implementation report, demo guide and screenshots are under [`docs/26Aug2026/`](docs/26Aug2026/).

## Repository structure

```text
.
├── public/                    # Static application
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── robots.txt
├── scripts/
│   ├── bootstrap-ubuntu.sh   # Install Docker and configure UFW
│   ├── deploy.sh             # Build, run and health-check
│   └── update.sh             # Pull and redeploy
├── .github/workflows/        # GitHub Actions container smoke test
├── Caddyfile                 # Static server, compression and security headers
├── Dockerfile
├── compose.yaml
└── .env.example
```

No external font, JavaScript or CSS CDN is required at runtime.

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
- Preserve visible `Illustrative`, missing-data and method-limitation states.
- Never commit AWS credentials, personal data or operational facility/vulnerability records.
- Candidate shelters must not be described as safe, suitable, approved or operational.
- Do not describe straight-line proximity as walking distance, travel time, route safety or capacity coverage.

## Production-readiness boundary

This container is deployment-ready as a **static prototype**, not as an operational disaster-management service. A production release still requires authentication/authorization decisions, authoritative data adapters, audit storage, privacy controls, monitoring, backup/recovery and approved scientific methods.
