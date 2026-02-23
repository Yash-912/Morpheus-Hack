# ============================================================
# GigPay Frontend — Dockerfile (Dev)
# ============================================================
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (Docker layer caching)
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Expose dev server port
EXPOSE 3000

# Start Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
