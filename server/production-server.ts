import express, { type Request, Response, NextFunction } from "express";
import { config } from "dotenv";
import { registerRoutes } from "./routes-final";
import path from "path";
import fs from "fs";

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

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(`${new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit", 
        second: "2-digit",
        hour12: true,
      })} [express] ${logLine}`);
    }
  });

  next();
});

// Production static file serving function
function serveStaticFiles(app: express.Express) {
  // Look for built frontend in multiple possible locations
  const possiblePaths = [
    path.resolve(process.cwd(), "client/dist"),
    path.resolve(process.cwd(), "dist"),
    path.resolve(process.cwd(), "build"),
    path.resolve(__dirname, "../client/dist"),
    path.resolve(__dirname, "../dist"),
    path.resolve(__dirname, "public")
  ];

  let staticPath = null;
  for (const checkPath of possiblePaths) {
    if (fs.existsSync(checkPath) && fs.existsSync(path.join(checkPath, "index.html"))) {
      staticPath = checkPath;
      break;
    }
  }

  if (!staticPath) {
    console.warn("No built frontend found. Serving API only. Frontend paths checked:", possiblePaths);
    return;
  }

  console.log(`Serving static files from: ${staticPath}`);
  app.use(express.static(staticPath));

  // Catch-all handler for SPA routing
  app.use("*", (req: Request, res: Response) => {
    // Don't catch API routes
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.resolve(staticPath!, "index.html"));
  });
}

(async () => {
  try {
    const server = await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error('Error handled by middleware:', err);
      res.status(status).json({ message });
    });

    // Serve static files in production
    serveStaticFiles(app);

    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen(port, "0.0.0.0", () => {
      console.log(`${new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit", 
        hour12: true,
      })} [express] production server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start production server:', error);
    process.exit(1);
  }
})();