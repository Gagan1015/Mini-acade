# syntax=docker/dockerfile:1.7
#
# Build context: repository root (NOT client/).
#   docker build -f client/Dockerfile -t arcado-client .
#
# Produces a minimal Next.js standalone image (~150 MB) suitable for
# AWS ECS Fargate. Listens on $PORT (default 3000).

# ───────────────────────────────────────── base ─────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate
WORKDIR /repo

# ───────────────────────────────────── deps stage ─────────────────────────────────────
# Install ALL workspace deps (incl. dev) so we can build. We also generate the
# Prisma client here so it's available to both build and runtime stages.
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY client/package.json ./client/
COPY db/package.json ./db/
COPY server/package.json ./server/
COPY shared/package.json ./shared/
COPY db/prisma ./db/prisma
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm --filter @arcado/db exec prisma generate

# ────────────────────────────────────── build stage ──────────────────────────────────────
FROM deps AS builder
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Public env vars are inlined into the Next.js bundle at build time. Pass any
# `NEXT_PUBLIC_*` values you want baked in via `--build-arg` from your CI.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}

COPY shared ./shared
COPY db ./db
COPY client ./client

RUN pnpm --filter @arcado/shared build \
 && pnpm --filter @arcado/db build \
 && pnpm --filter @arcado/client build

# ────────────────────────────────────── runner stage ──────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl tini
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S app && adduser -S app -G app

# Next.js standalone bundle reproduces the monorepo layout under /app.
# The entry point is at client/server.js. Next's file tracer pulls in
# @prisma/client and the workspace deps, but it does NOT follow Prisma's
# dynamic `.so.node` engine load. The bundled prisma runtime searches a
# fixed list of paths (logged on failure); `/app/client/.next/server` is
# one of them and the only one without a hashed pnpm dir, so we drop the
# engine binary there. The schema's `output` pin guarantees the binary
# lives at /repo/node_modules/.prisma/client/ in the builder stage.
COPY --from=builder --chown=app:app /repo/client/.next/standalone ./
COPY --from=builder --chown=app:app /repo/client/.next/static ./client/.next/static
COPY --from=builder --chown=app:app /repo/client/public ./client/public
COPY --from=builder --chown=app:app /repo/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder --chown=app:app /repo/node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node /app/client/.next/server/libquery_engine-linux-musl-openssl-3.0.x.so.node

USER app
EXPOSE 3000

# Lightweight TCP healthcheck (no curl in alpine slim).
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=20s \
  CMD node -e "require('node:net').createConnection({host:'127.0.0.1',port:process.env.PORT||3000}).on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))" \
  || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "client/server.js"]
