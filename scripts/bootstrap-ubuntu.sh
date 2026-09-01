#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run with sudo: sudo ./scripts/bootstrap-ubuntu.sh" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl gnupg git python3 ufw

have_docker=false
if command -v docker >/dev/null 2>&1; then
  echo "Existing Docker installation detected: $(docker --version || true)"
  systemctl enable --now docker 2>/dev/null || true
  if docker compose version >/dev/null 2>&1; then
    have_docker=true
    echo "Existing Docker Engine and Compose plugin are ready. Skipping Docker reinstallation."
  else
    echo "Docker exists, but the Compose plugin is missing. It will be installed from Docker's Ubuntu repository."
  fi
fi

if [[ "$have_docker" != "true" ]]; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc

  source /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list
  apt-get update

  if command -v docker >/dev/null 2>&1; then
    apt-get install -y docker-buildx-plugin docker-compose-plugin
  else
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  fi
  systemctl enable --now docker
fi

# Fail clearly if an existing installation is incompatible.
docker --version
docker compose version

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

TARGET_USER="${SUDO_USER:-}"
if [[ -n "$TARGET_USER" && "$TARGET_USER" != "root" ]]; then
  usermod -aG docker "$TARGET_USER"
  echo "Added $TARGET_USER to the docker group. Reconnect SSH before deploying."
else
  echo "Docker is ready. If needed, add your deployment user with: sudo usermod -aG docker USERNAME"
fi

echo "Bootstrap complete. Ports 22, 80 and 443 are allowed by UFW."
