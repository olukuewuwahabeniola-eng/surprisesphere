import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { connectDB, dbState } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import apiRoutes from './routes/index.js';

const app = express();
const port = Number(process.env.PORT) || 5050;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5174';

app.disable('x-powered-by');

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(
  cors({
    origin: clientUrl,
    methods: ['GET', 'POST'],
  }),
);

app.use(express.json({ limit: '100kb' }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests. Please wait a moment.' },
  }),
);

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

async function start() {
  await connectDB();

  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
    console.log(`Database status: ${dbState.status}`);
    if (dbState.status !== 'connected') {
      console.warn(
        'Product data is serving from temporary seed fallback until MongoDB is connected and seeded.',
      );
    }
  });
}

start().catch((error) => {
  console.error(`API failed to start: ${error.message}`);
  process.exit(1);
});
