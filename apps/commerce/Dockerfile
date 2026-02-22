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
RUN npm run build

# Production: full app from builder so .medusa/ and all runtime files are present
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app ./

EXPOSE 9000
CMD ["npm", "run", "start"]
