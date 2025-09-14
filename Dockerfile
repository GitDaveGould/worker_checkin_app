# Production Dockerfile for App Runner
FROM node:18-alpine AS base

# Install dependencies for both client and server
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
COPY shared/ ../shared/
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy server build and dependencies
COPY --from=base /app/server/dist ./dist/server
COPY --from=base /app/server/node_modules ./node_modules
COPY --from=base /app/server/package*.json ./

# Copy client build
COPY --from=base /app/client/dist ./dist/client

# Copy shared types
COPY --from=base /app/shared ./shared

# Copy root package.json for any shared dependencies
COPY --from=base /app/package*.json ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/server/index.js"]