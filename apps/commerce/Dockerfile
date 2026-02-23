# Medusa server: build produces .medusa/ (admin + server); must be in image for runtime.
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies (matches Railway npm + .npmrc legacy-peer-deps)
FROM base AS deps
COPY package.json .npmrc* ./
RUN npm install --legacy-peer-deps

# Build: run medusa build so .medusa/ (incl. admin index.html) exists at runtime
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Production: full app from builder; fail build if admin was not built (Medusa expects .medusa/server/public/admin/index.html)
FROM base AS runner
ENV NODE_ENV=production
ENV DISABLE_MEDUSA_ADMIN=false
COPY --from=builder /app ./
RUN test -f .medusa/server/public/admin/index.html || (echo "Admin build missing. Clear Railway build cache and redeploy." && exit 1)

EXPOSE 9000
CMD ["npm", "run", "start"]
