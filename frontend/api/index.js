/**
 * Vercel serverless entry when the project Root Directory is `frontend`.
 * Imports the shared Express app from the monorepo backend folder.
 */
import app, { ensureDb } from '../../backend/app.js';

await ensureDb();

export default app;
