# Attesta dashboard as a SPIFFE workload. The spire-agent binary is only used by
# docker-entrypoint.sh to fetch this container's X.509 SVID from the Workload API.
FROM ghcr.io/spiffe/spire-agent:1.15.3 AS spire

FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=spire /opt/spire/bin/spire-agent /opt/spire/bin/spire-agent
COPY --from=build /app ./
USER 1007
EXPOSE 3000
ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
