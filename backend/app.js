import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { connectDB, dbState } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import apiRoutes from './routes/index.js';

let connectionPromise;

export function ensureDb() {
  if (!connectionPromise) {
    connectionPromise = connectDB();
  }
  return connectionPromise;
}

function parseAllowedOrigins() {
  const raw = process.env.CLIENT_URL || 'http://localhost:5174';
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function createApp() {
  const app = express();
  const allowedOrigins = parseAllowedOrigins();

  app.disable('x-powered-by');

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin browser calls and non-browser tools send no Origin.
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );

  app.use(express.json({ limit: '200kb' }));

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: 'Too many requests. Please wait a moment.' },
    }),
  );

  app.use(async (req, res, next) => {
    try {
      await ensureDb();
      next();
    } catch (error) {
      next(error);
    }
  });

  app.get('/', (req, res) => {
    res.json({
      name: 'Surprise Fashion Sphere API',
      health: '/api/health',
      homepage: '/api/homepage',
      products: '/api/products',
      categories: '/api/categories',
      database: dbState.status,
    });
  });

  app.use('/api', apiRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

const app = createApp();
export default app;
