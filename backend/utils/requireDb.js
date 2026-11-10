import { isDbConnected } from '../config/db.js';
import { AppError } from './AppError.js';

export function requireDb() {
  if (!isDbConnected()) {
    throw new AppError(
      'The store database is not connected. Start MongoDB and set MONGO_URI, then try again.',
      503,
    );
  }
}
