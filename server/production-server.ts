import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes-final.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from dist/public
const publicPath = path.join(__dirname, "../dist/public");
app.use(express.static(publicPath));

// Setup database connection
console.log('Using production database from .env file for application connection');
console.log('Database URL configured:', (process.env.DATABASE_URL || '').replace(/:[^:@]*@/, ':***@'));

// Middleware for authentication in production
app.use((req, res, next) => {
  // Allow auth endpoints and health check
  if (req.path.startsWith('/api/auth') || req.path === '/health' || req.path.startsWith('/api/team')) {
    return next();
  }
  
  // For static files, always allow
  if (req.path.includes('.') && !req.path.startsWith('/api/')) {
    return next();
  }
  
  // API endpoints require authentication - but we'll handle this in the routes
  next();
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'Supabase (Neon serverless)'
  });
});

// Register API routes
async function startServer() {
  try {
    const server = await registerRoutes(app);
    
    // Catch-all handler for SPA routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(publicPath, 'index.html'));
    });

    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });

    server.listen(PORT, () => {
      console.log(`🚀 Production server running on port ${PORT}`);
      console.log(`📁 Serving static files from: ${publicPath}`);
      console.log(`🔗 Database: Supabase (Neon serverless)`);
    });
  } catch (error) {
    console.error('Failed to start production server:', error);
    process.exit(1);
  }
}

startServer();