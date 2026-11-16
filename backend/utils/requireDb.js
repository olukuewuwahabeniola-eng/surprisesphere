import { ensureConnected, isDbConnected } from '../config/db.js';
import { AppError } from './AppError.js';

export function requireDb() {
  if (isDbConnected()) {
    return;
  }

  throw new AppError(
    'The store database is not connected. Start MongoDB and set MONGO_URI, then try again.',
    503,
  );
}

/**
 * Prefer this in async handlers/services that can wait briefly for a reconnect.
 */
export async function requireDbReady() {
  const ok = await ensureConnected({ retries: 4, waitMs: 700 });
  if (!ok) {
    throw new AppError(
      'The store database is not connected. Start MongoDB and set MONGO_URI, then try again.',
      503,
    );
  }
}
