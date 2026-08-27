# AI / developer handover

**Last updated:** 27 August 2026  
**Repository:** `https://github.com/kovitad/SERVIR_GRP_DEMO.git`  
**Branch:** `main`

## Current product state

The deployable prototype is a static Caddy application packaged with Docker. It supports the Thailand evacuation-preparedness planning journey, a real interactive OpenStreetMap basemap, the SERVIR Global Collaborative theme, and application-wide English/Thai switching.

The latest UI release is **0.3.0**. The language selector is in the top-right header and stores the selected language in browser `localStorage` under `grp-language`.

## Source of truth

Use these files for GitHub and deployment work:

- `public/index.html` — application markup and EN/TH control
- `public/styles.css` — application styles plus the 27 August SERVIR theme
- `public/app.js` — prototype interactions and generated planning content
- `public/i18n.js` — English/Thai runtime localisation, including dynamic DOM content
- `public/map-integration.js` — Leaflet setup, AOI navigation and map-bound planning overlays
- `public/vendor/leaflet/` — locally hosted Leaflet 1.9.4 JavaScript, CSS and marker assets
- `public/assets/servir-global-collaborative.png` — logo extracted from `prototype/27Aug2026/SERVIR Global Platform PoC.pptx` in the original workspace
- `Dockerfile`, `Caddyfile`, `compose.yaml` — production container package
- `scripts/bootstrap-ubuntu.sh` — first-time Ubuntu/Lightsail setup
- `scripts/deploy.sh` — initial build/deploy and health check
- `scripts/update.sh` — pull, rebuild, restart and health check

The parent workspace also has copies under `prototype/`, but **`prototype/github/public/` is the deployable GitHub source of truth**. Synchronise intentionally if work begins in the parent prototype.

## Docker and AWS Lightsail contract

- Base image: `caddy:2.8.4-alpine`
- Public ports: TCP 80/443 and UDP 443
- Runtime limit: 256 MB memory and 1 CPU in Compose
- Restart policy: `unless-stopped`
- Application health endpoint: `/healthz`
- Real basemap: public OpenStreetMap standard tiles for low-traffic prototype use; no API key
- Required attribution is displayed by Leaflet
- Caddy CSP explicitly permits map images from `https://tile.openstreetmap.org`
- Container health check verifies `http://127.0.0.1/healthz`
- Persistent Caddy data/config use named Docker volumes
- `.env.example` defaults to `SITE_ADDRESS=:80` for static-IP HTTP testing
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
./scripts/deploy.sh
curl -f http://127.0.0.1/healthz
```

Subsequent deployment:

```bash
cd SERVIR_GRP_DEMO
./scripts/update.sh
```

## Validation completed

- `node --check public/app.js`
- `node --check public/i18n.js`
- `docker compose config --quiet`
- Browser validation of EN/TH switching, persistence, dynamic assistant output, the SERVIR theme and result layout
- Browser validation of OpenStreetMap loading, AOI fly-to, zoom/pan and illustrative Leaflet overlays
- GitHub Actions now validates both JavaScript files, builds the image, checks `/healthz`, and requests the localisation and logo assets

The local Windows Docker Desktop daemon was not running during the 27 August handover, so a local image build could not be executed there. The GitHub Actions container check is the authoritative build/smoke test; verify its result after each push. The package itself is Linux/Ubuntu/Lightsail compatible.

## Important implementation notes

1. `i18n.js` translates initial and dynamically inserted DOM text with a `MutationObserver`. Add new English UI phrases to its exact dictionary or ordered fragment list whenever `app.js` gains user-facing content.
2. Preserve technical identifiers such as AOI, RP20/RP50/RP100, CRS, GeoJSON and H/M/L where appropriate.
3. The prototype displays real AOI names but mocked boundaries, candidates, population and analytical results. Do not weaken these limitations.
4. No individual or household locations are displayed. Vulnerability categories can overlap and must not be summed.
5. Low/green risk does not mean safe, and candidate locations are not approved shelters.
6. The OpenStreetMap basemap is real, but the AOI outline and all analytical overlays remain mocked. Public OSM tiles are appropriate only for this limited prototype; move to a managed or self-hosted provider before significant public traffic.

## Recommended next checks

1. Confirm the latest GitHub Actions **Container check** is green.
2. On Lightsail, run `./scripts/update.sh` and verify `docker compose ps`, `/healthz`, the logo request and EN/TH switching.
3. If new workflows are added, exercise every dynamic message in Thai and add missing translations to `public/i18n.js`.
