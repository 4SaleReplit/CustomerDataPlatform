// server/vite-production.ts
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
function serveStatic(app) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
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
        `Could not find the build directory. Tried: ${distPath}, ${fallbackPaths.join(", ")}. Make sure to build the client first with 'npm run build'`
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
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
async function setupVite(app, server) {
  log("Warning: setupVite called in production mode, falling back to static serving");
  serveStatic(app);
}
export {
  log,
  serveStatic,
  setupVite
};
