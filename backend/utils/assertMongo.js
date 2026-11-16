import { ensureConnected, isDbConnected } from '../config/db.js';
import { AppError } from './AppError.js';

/**
 * Wait briefly for a reconnect before failing admin/catalogue writes.
 * Prevents flaky Atlas blips from looking like a permanent outage.
 */
export async function assertMongoReady(message) {
  if (isDbConnected()) {
    return;
  }

  const ok = await ensureConnected({ retries: 4, waitMs: 700 });
  if (ok) {
    return;
  }

  throw new AppError(
    message ||
      'MongoDB must be connected. Start MongoDB and set MONGO_URI, then try again.',
    503,
  );
}
