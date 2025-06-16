import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  // For production builds, the frontend is built to dist/public
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    // Fallback: try to find the built frontend in common locations
    const fallbackPaths = [
      path.resolve(process.cwd(), "client/dist"),
      path.resolve(process.cwd(), "dist/public"),
      path.resolve(__dirname, "../client/dist")
    ];
    
    let foundPath = null;
    for (const fallbackPath of fallbackPaths) {
      if (fs.existsSync(fallbackPath)) {
        foundPath = fallbackPath;
        break;
      }
    }
    
    if (!foundPath) {
      throw new Error(
        `Could not find the build directory. Tried: ${distPath}, ${fallbackPaths.join(', ')}. Make sure to build the client first with 'npm run build'`,
      );
    }
    
    log(`Using fallback frontend path: ${foundPath}`);
    app.use(express.static(foundPath));
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(foundPath, "index.html"));
    });
    return;
  }

  log(`Serving static files from: ${distPath}`);
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// Production-safe setup function (no Vite dependencies)
export async function setupVite(app: Express, server: Server) {
  // In production, this function should not be called
  // But if it is, just serve static files
  log("Warning: setupVite called in production mode, falling back to static serving");
  serveStatic(app);
}