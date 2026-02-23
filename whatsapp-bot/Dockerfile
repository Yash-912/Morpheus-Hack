# ============================================================
# GigPay WhatsApp Bot — Dockerfile
# ============================================================
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (Docker layer caching)
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source
COPY . .

# Expose bot port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Start the server
CMD ["node", "server.js"]
