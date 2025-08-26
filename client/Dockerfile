# Build stage
FROM node:20 as build

WORKDIR /app

# Install build tools required for Rollup/Vite native deps
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy lock file + package.json
COPY package*.json ./

# Use clean install (deterministic)
RUN npm ci

# Copy rest of the client code
COPY . .

# Run build
RUN npm run build

# Expose Vite dev server port
EXPOSE 8080

# Start Vite in dev mode (hot reload)
CMD ["npm", "run", "dev"]
