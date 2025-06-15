#!/usr/bin/env node

/**
 * Production Build Script
 * Builds frontend and server separately for production deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🏗️  Building Customer Data Platform for Production');
console.log('=' .repeat(60));

try {
  // Step 1: Build frontend with Vite
  console.log('\n1. Building frontend...');
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('✅ Frontend build complete');

  // Step 2: Build server with proper exclusions
  console.log('\n2. Building server...');
  const esbuildCommand = [
    'npx esbuild server/index.ts',
    '--platform=node',
    '--packages=external',
    '--bundle',
    '--format=esm',
    '--outdir=dist',
    '--external:vite',
    '--external:@vitejs/plugin-react',
    '--external:@replit/vite-plugin-runtime-error-modal',
    '--external:@replit/vite-plugin-cartographer'
  ].join(' ');

  execSync(esbuildCommand, { stdio: 'inherit' });
  console.log('✅ Server build complete');

  // Step 3: Create a simple production server that doesn't import Vite
  console.log('\n3. Creating production server...');
  
  const productionServer = `import express, { type Request, Response, NextFunction } from "express";
import { config } from "dotenv";
import { registerRoutes } from "./routes";
import path from "path";

// Load environment variables
config();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

function log(message, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(\`\${formattedTime} [\${source}] \${message}\`);
}

function serveStatic(app) {
  // Serve static files from public directory
  app.use(express.static("public"));
  
  // Catch-all handler for SPA routing
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve("public/index.html"));
  });
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = \`\${req.method} \${path} \${res.statusCode} in \${duration}ms\`;
      if (capturedJsonResponse) {
        logLine += \` :: \${JSON.stringify(capturedJsonResponse)}\`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error('Error handled by middleware:', err);
      res.status(status).json({ message });
    });

    // Always serve static files in production
    serveStatic(app);

    // Start server on port 5000
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      log(\`Customer Data Platform running on port \${port}\`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
`;

  fs.writeFileSync('dist/index-production.js', productionServer);
  console.log('✅ Production server created');

  console.log('\n✅ Production build complete!');
  console.log('\n📁 Build output:');
  console.log('   - Frontend: dist/public/');
  console.log('   - Server: dist/index-production.js');
  console.log('   - Shared: server/routes.js (bundled)');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}