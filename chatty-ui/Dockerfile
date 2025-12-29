# Chatty-UI Backend Dockerfile
FROM node:22-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source files
COPY server.js ./

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose backend port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/api/stats || exit 1

# Run the server
CMD ["node", "server.js"]
