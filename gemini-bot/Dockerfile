FROM node:22-alpine

# Install dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev for tests)
RUN npm install

# Copy source code
COPY server.js ./
COPY cli.js ./
COPY src ./src
COPY tests ./tests

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 3003

# Default command - start the server
CMD ["node", "server.js"]
