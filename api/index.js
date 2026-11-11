/**
 * Vercel serverless entry for the Express API.
 * Keeps /api/* on the same origin as the React storefront.
 */
import app, { ensureDb } from '../backend/app.js';

await ensureDb();

export default app;
