import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analysisRoutes from './routes/analysisRoutes';
import { connectDatabase } from './config/database';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Robust CORS: allow specific origins from env and any localhost/127.0.0.1 in development
const explicitOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:5174'];
const allowLocalWildcard = (process.env.NODE_ENV || 'development') !== 'production';

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (like curl/postman without Origin header)
    if (!origin) return callback(null, true);

    // If explicitly allowed
    if (explicitOrigins.includes(origin)) return callback(null, true);

    // Allow any localhost/127.0.0.1 with any port in non-production
    if (allowLocalWildcard && /^https?:\/\/(localhost|127\.0\.0\.1)(:\\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Ensure preflight requests are handled for all routes with identical options
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', analysisRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'Autism Screening Backend Running',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    database: 'in-memory',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server and connect to database
const startServer = async () => {
  // Connect to MongoDB
  await connectDatabase();

  const server = app.listen(PORT, () => {
    console.log('🚀 ========================================');
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '⚠️  Not configured'}`);
    console.log('🚀 ========================================');
    console.log('📍 Endpoints:');
    console.log('   GET  /health - Health check');
    console.log('   POST /api/analyze - Analyze child');
    console.log('   GET  /api/screenings - Get all screenings');
    console.log('   GET  /api/screenings/:id - Get screening by ID');
    console.log('🚀 ========================================');
  });

  // Better error handling for common server startup issues
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use.\n` +
        'Possible fixes:\n' +
        `  - Stop the process currently using port ${PORT} (for example: ` +
        "`lsof -i :${PORT}` then `kill <PID>` on Linux).\n" +
        `  - Or set a different port before starting the server: PORT=5001 npm run dev\n`
      );
      process.exit(1);
    }
    // Re-throw unknown errors
    throw err;
  });
};

startServer();
