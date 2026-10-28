# Imagen única del monolito (RNF-04): compila el frontend y el backend,
# y en producción Express sirve la API (/api) y el sitio desde el mismo proceso.
#   docker build -t canchas-jireh .

ARG NODE_VERSION=24-alpine

FROM node:${NODE_VERSION} AS base
WORKDIR /app
# Manifiestos de todos los workspaces: el lockfile los necesita para npm ci.
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY e2e/package.json e2e/

# --- Compilación: dependencias completas, cliente de Prisma, backend y frontend ---
FROM base AS build
RUN npm ci -w backend -w frontend --include-workspace-root
COPY tsconfig.base.json ./
COPY backend backend
COPY frontend frontend
RUN npm run db:generate -w backend \
 && npm run build -w backend \
 && npm run build -w frontend

# --- Dependencias de producción del backend únicamente ---
FROM base AS deps
RUN npm ci --omit=dev -w backend && mkdir -p backend/node_modules

# --- Imagen final: sin compiladores ni dependencias de desarrollo, usuario sin privilegios ---
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production
ENV FRONTEND_DIST=/app/frontend/dist
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=deps --chown=node:node /app/backend/node_modules ./backend/node_modules
COPY --from=build --chown=node:node /app/backend/package.json /app/backend/prisma.config.ts ./backend/
COPY --from=build --chown=node:node /app/backend/prisma ./backend/prisma
COPY --from=build --chown=node:node /app/backend/dist ./backend/dist
COPY --from=build --chown=node:node /app/frontend/dist ./frontend/dist
COPY --chown=node:node backend/docker-entrypoint.sh /usr/local/bin/arrancar
RUN chmod +x /usr/local/bin/arrancar && mkdir -p /app/backend/uploads && chown node:node /app/backend/uploads

WORKDIR /app/backend
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=30s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/api/health" > /dev/null || exit 1
ENTRYPOINT ["arrancar"]
