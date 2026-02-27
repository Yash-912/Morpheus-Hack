# ============================================================
# GigPay Backend — Dockerfile
# ============================================================
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for native modules (sharp, bcrypt) and Prisma (openssl)
RUN apk add --no-cache python3 make g++ openssl1.1-compat

# Copy package files first (Docker layer caching)
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose API port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Start the server
CMD ["node", "server.js"]
