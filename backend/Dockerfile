FROM node:22-alpine

LABEL org.opencontainers.image.title="GRP AI Observability Backend" \
      org.opencontainers.image.description="Server-side OpenAI and Langfuse Type B-lite pilot"

WORKDIR /app
COPY server.js ./server.js
COPY data ./data
RUN mkdir -p /app/storage && chown node:node /app/storage

ENV NODE_ENV=production \
    PORT=3000

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/healthz || exit 1

CMD ["node", "server.js"]
