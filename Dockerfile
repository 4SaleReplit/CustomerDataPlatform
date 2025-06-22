# Optimized single-stage build for Customer Data Platform
FROM node:20-alpine

# Install only essential system dependencies
RUN apk add --no-cache dumb-init

# Create app directory and user
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S cdp -u 1001

# Copy package files first for better caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --silent && npm cache clean --force

# Copy pre-built application files
COPY --chown=cdp:nodejs dist ./dist
COPY --chown=cdp:nodejs server/production-server.js ./server/
COPY --chown=cdp:nodejs shared ./shared

# Create necessary directories
RUN mkdir -p uploads logs && chown -R cdp:nodejs uploads logs

# Switch to non-root user
USER cdp

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/production-server.js"]