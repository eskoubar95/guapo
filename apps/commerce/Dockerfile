# Medusa server: build produces .medusa/ (admin + server); must be in image for runtime.
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies (matches Railway npm + .npmrc legacy-peer-deps)
FROM base AS deps
COPY package.json .npmrc* ./
RUN npm install --legacy-peer-deps

# Build: medusa build (no NODE_ENV=production here – Medusa then requires REDIS_URL/JWT_SECRET/COOKIE_SECRET at build time; Railway only provides them at runtime).
# MEDUSA_BACKEND_URL must be set at build time so admin UI bakes in the correct API URL (__BACKEND_URL__); otherwise login calls go to localhost.
ARG MEDUSA_BACKEND_URL
ENV MEDUSA_BACKEND_URL=${MEDUSA_BACKEND_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production: build writes admin to dist/public/admin; runtime loader expects public/admin – copy and validate
FROM base AS runner
ENV NODE_ENV=production
ENV DISABLE_MEDUSA_ADMIN=false
COPY --from=builder /app ./
RUN test -f dist/public/admin/index.html || (echo "Admin build missing. Clear Railway build cache and redeploy." && exit 1) \
  && mkdir -p public && cp -r dist/public/admin public/

EXPOSE 9000
CMD ["npm", "run", "start"]
