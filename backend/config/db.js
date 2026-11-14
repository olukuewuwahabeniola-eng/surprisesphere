import mongoose from 'mongoose';

export const dbState = {
  status: 'disconnected',
  lastError: '',
};

function resolveMongoUri() {
  const raw = process.env.MONGO_URI || process.env.MONGODB_URI || '';
  if (!raw) return '';

  // Atlas SRV URIs without a path default to the "test" database — keep that explicit.
  try {
    if (raw.startsWith('mongodb+srv://') || raw.startsWith('mongodb://')) {
      const parsed = new URL(raw);
      if (!parsed.pathname || parsed.pathname === '/') {
        parsed.pathname = '/test';
        return parsed.toString();
      }
    }
  } catch {
    // Fall through with the raw URI if parsing fails.
  }

  return raw;
}

export function isDbConnected() {
  return dbState.status === 'connected' && mongoose.connection.readyState === 1;
}

export async function connectDB() {
  const uri = resolveMongoUri();

  if (!uri) {
    dbState.status = 'skipped';
    dbState.lastError = 'MONGO_URI is not set';
    console.warn('MONGO_URI is not set. The API is running without a database.');
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    dbState.status = 'connected';
    dbState.lastError = '';
    return true;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      // Force IPv4 — Windows/Atlas SRV lookups often fail intermittently over IPv6.
      family: 4,
    });
    dbState.status = 'connected';
    dbState.lastError = '';
    console.log(`MongoDB connected (db=${mongoose.connection.name})`);
    return true;
  } catch (error) {
    dbState.status = 'disconnected';
    dbState.lastError = error.message;
    console.error(`MongoDB connection failed: ${error.message}`);
    // Clear a half-open connection so the next ensureDb() can retry cleanly.
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    return false;
  }
}

mongoose.connection.on('connected', () => {
  dbState.status = 'connected';
  dbState.lastError = '';
});

mongoose.connection.on('disconnected', () => {
  if (dbState.status === 'connected') {
    dbState.status = 'disconnected';
  }
});

mongoose.connection.on('error', (error) => {
  dbState.status = 'disconnected';
  dbState.lastError = error.message;
  console.error(`MongoDB error: ${error.message}`);
});
