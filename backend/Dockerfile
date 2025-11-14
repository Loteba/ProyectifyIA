# ===== Base común (como root para evitar problemas de perms en npm ci) =====
FROM node:20-alpine AS base
WORKDIR /app

# ===== Dependencias (producción) =====
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# ===== Dependencias (desarrollo) =====
FROM base AS devdeps
COPY package*.json ./
RUN npm ci

# ===== Runtime (producción) =====
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

# Copiamos node_modules de prod y luego el código
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Creamos usuario no root y damos permisos al directorio
RUN addgroup -S app && adduser -S app -G app \
  && chown -R app:app /app
USER app

EXPOSE 5000
CMD ["node", "server.js"]

# ===== Runtime (desarrollo con nodemon) =====
FROM node:20-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development

# nodemon global
RUN npm i -g nodemon

# Copiamos node_modules de dev y luego el código
COPY --from=devdeps /app/node_modules ./node_modules
COPY . .

# Usuario no root y permisos
RUN addgroup -S app && adduser -S app -G app \
  && chown -R app:app /app
USER app

EXPOSE 5000
CMD ["nodemon", "--legacy-watch", "server.js"]
