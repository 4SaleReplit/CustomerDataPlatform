# Multi-stage build for Customer Data Platform
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    cairo-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev \
    libjpeg-turbo-dev \
    pixman-dev \
    python3 \
    make \
    g++

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S cdp -u 1001

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=cdp:nodejs /app/dist ./dist
COPY --from=builder --chown=cdp:nodejs /app/server ./server
COPY --from=builder --chown=cdp:nodejs /app/shared ./shared
COPY --from=builder --chown=cdp:nodejs /app/client/dist ./client/dist

# Copy additional necessary files
COPY --chown=cdp:nodejs uploads ./uploads
COPY --chown=cdp:nodejs drizzle.config.ts ./
COPY --chown=cdp:nodejs tsconfig.json ./
COPY --chown=cdp:nodejs .env.example ./.env.example

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chown -R cdp:nodejs uploads

# Switch to non-root user
USER cdp

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "server/production-server.js"]