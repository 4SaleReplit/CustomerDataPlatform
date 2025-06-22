# Production Dockerfile for Customer Data Platform
FROM node:20-alpine

# Install essential dependencies
RUN apk add --no-cache wget dumb-init

# Create app directory and user
WORKDIR /app
RUN adduser -D cdp

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production --silent --no-audit && npm cache clean --force

# Copy pre-built application files
COPY --chown=cdp:cdp dist ./dist
COPY --chown=cdp:cdp server/production-server.js ./server/
COPY --chown=cdp:cdp shared ./shared

# Create necessary directories
RUN mkdir -p uploads logs && chown -R cdp:cdp uploads logs

# Switch to non-root user
USER cdp

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=2 \
    CMD wget -q --spider http://localhost:5000/health || exit 1

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/production-server.js"]