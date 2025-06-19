import express, { type Request, Response, NextFunction } from "express";
import { config } from "dotenv";
import { registerRoutes } from "./routes-final";
import { cronJobService } from "./services/cronJobService";
import path from "path";

// Load environment variables
config();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
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

(async () => {
  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error('Error handled by middleware:', err);
      res.status(status).json({ message });
    });

    // Handle development vs production serving
    if (process.env.NODE_ENV === "production") {
      // Production: serve static files directly without Vite
      const { serveStatic } = await import("./vite-production");
      serveStatic(app);
    } else {
      // Development: use Vite for hot reloading
      const { setupVite } = await import("./vite");
      await setupVite(app, server);
    }

    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      console.log(`${new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit", 
        hour12: true,
      })} [express] serving on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    // Fallback server with minimal static serving
    // express and path already imported at top
    
    if (process.env.NODE_ENV === "production") {
      const distPath = path.resolve(__dirname, "public");
      app.use(express.static(distPath));
      app.use("*", (_req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    }
    
    const server = app.listen(5000, "0.0.0.0", () => {
      console.log(`${new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })} [express] serving on port 5000 (fallback mode)`);
    });
  }
})();
