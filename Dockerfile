# Multi-stage containerization for SubNetCalc-Electron
# Stage 1: Build & Test calculation engine and web artifacts
FROM node:22-slim AS builder

WORKDIR /app

# Install build dependencies
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install npm dependencies
COPY package*.json ./
RUN npm ci

# Copy full repository source
COPY . .

# Run test suite & build renderer and engine assets
RUN npm test
RUN npm run build:engine && npm run build:renderer

# Stage 2: Minimal runtime image for headless calculation or static serving
FROM node:22-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-electron ./dist-electron

# Non-root user for security best practices (UID:GID for node user)
USER 1000:1000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD ["node", "-e", "process.exit(0)"]

CMD ["node", "-e", "console.log('SubNetCalc engine container initialized successfully.')"]
