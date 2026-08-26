FROM caddy:2.8.4-alpine

LABEL org.opencontainers.image.title="GRP Thailand Evacuation Preparedness Prototype" \
      org.opencontainers.image.description="Self-contained static prototype for district/Tambon evacuation planning"

COPY Caddyfile /etc/caddy/Caddyfile
COPY public/ /srv/

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:2019/config/ || exit 1
