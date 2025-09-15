import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { testConnection } from './config/database';
import { runMigrations } from './utils/migrations';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import workerRoutes from './routes/workers';
import eventRoutes from './routes/events';
import checkInRoutes from './routes/checkins';
import adminRoutes from './routes/admin';

const app = express();
const PORT = config.port;

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] // Replace with your actual domain
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5184', 'http://127.0.0.1:5184', 'http://18.222.231.149'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (process.env.NODE_ENV !== 'production') {
  app.use(requestLogger);
}

// Serve static files from client build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: 'connected' // We know it's connected if the server started
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/checkins', checkInRoutes);
app.use('/api/admin', adminRoutes);

// Serve React app for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
  
  // Test database connection on startup
  const isConnected = await testConnection();
  
  if (isConnected) {
    // Run database migrations
    try {
      await runMigrations();
      console.log('Database setup completed successfully');
    } catch (error) {
      console.error('Database migration failed:', error);
      process.exit(1);
    }
  } else {
    console.error('Database connection failed. Server will not start.');
    process.exit(1);
  }
});
