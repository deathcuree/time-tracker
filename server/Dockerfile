# Server Dockerfile for local development

# Use Node.js 20 LTS
FROM node:20

# Set working directory
WORKDIR /app

# Install build tools if needed
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json for deterministic install
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the backend code
COPY . .

# Expose backend port
EXPOSE 5000

# Use nodemon for hot reload in development
CMD ["npm", "run", "dev"]
