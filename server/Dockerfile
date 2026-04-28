# syntax=docker/dockerfile:1.7
#
# Build context: repository root (NOT server/).
#   docker build -f server/Dockerfile -t arcado-server .
#
# Produces a small Node.js runtime image with `pnpm deploy` to bundle only
# the production deps the server actually needs. Listens on $PORT (default 3001)
# and serves both Express HTTP routes and Socket.IO websockets.

# ───────────────────────────────────────── base ─────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate
WORKDIR /repo

# ───────────────────────────────────── deps stage ─────────────────────────────────────
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

COPY shared ./shared
COPY db ./db
COPY server ./server

RUN pnpm --filter @arcado/shared build \
 && pnpm --filter @arcado/db build \
 && pnpm --filter @arcado/server build

# ───────────────────────────────────── prune (deploy) ─────────────────────────────────────
# `pnpm deploy` materializes a self-contained directory at /out with the
# server's runtime deps fully resolved (no symlinks), suitable for COPY.
# Workspace deps (@arcado/db, @arcado/shared) are pulled in based on their
# `files` field (`dist` + `prisma`), so they arrive built and runnable.
FROM builder AS pruner
# `--legacy` keeps the pre-pnpm-10 deploy behavior where workspace deps are
# materialized as full copies (using each workspace's `files` field). Without
# it, pnpm 10 demands `inject-workspace-packages=true` per package, which we
# don't use.
RUN pnpm --filter @arcado/server deploy --prod --legacy /out
# pnpm deploy copies package.json + node_modules but NOT the target package's
# own source/dist. Copy the compiled server output explicitly.
RUN cp -r /repo/server/dist /out/dist
# `prisma generate` writes the generated client to `/repo/node_modules/.prisma`
# (the path is pinned via `output` in db/prisma/schema.prisma). pnpm deploy
# does not see this directory because it isn't a declared dependency, so the
# runtime image needs it copied in explicitly. Without this, the server
# crashes on boot with: Cannot find module '.prisma/client/default'.
RUN cp -r /repo/node_modules/.prisma /out/node_modules/.prisma

# ────────────────────────────────────── runner stage ──────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl tini
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup -S app && adduser -S app -G app

COPY --from=pruner --chown=app:app /out ./

USER app
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=20s \
  CMD node -e "require('node:http').get('http://127.0.0.1:'+(process.env.PORT||3001)+'/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))" \
  || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
