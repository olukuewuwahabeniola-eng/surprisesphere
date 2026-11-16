import mongoose from 'mongoose';

export const dbState = {
  status: 'disconnected',
  lastError: '',
  lastConnectedAt: null,
  reconnectAttempts: 0,
};

const CONNECT_OPTIONS = {
  // Keep a small warm pool so requests do not pay a cold handshake every time.
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 60_000,
  // Atlas / Windows SRV lookups are unreliable over IPv6 on some networks.
  family: 4,
  // Fail selection quickly enough to retry, but allow Atlas cold starts.
  serverSelectionTimeoutMS: 12_000,
  connectTimeoutMS: 12_000,
  socketTimeoutMS: 45_000,
  heartbeatFrequencyMS: 10_000,
  // Driver-level retries for transient network blips.
  retryWrites: true,
  retryReads: true,
};

const KEEP_ALIVE_MS = 25_000;
const RECONNECT_BASE_MS = 1_500;
const RECONNECT_MAX_MS = 30_000;

let connectPromise = null;
let reconnectTimer = null;
let keepAliveTimer = null;
let listenersBound = false;
let intentionalClose = false;

function resolveMongoUri() {
  const raw = process.env.MONGO_URI || process.env.MONGODB_URI || '';
  if (!raw) return '';

  // Atlas SRV URIs without a path default to the "test" database — keep that explicit.
  try {
    if (raw.startsWith('mongodb+srv://') || raw.startsWith('mongodb://')) {
      const parsed = new URL(raw);
      if (!parsed.pathname || parsed.pathname === '/') {
        parsed.pathname = '/test';
      }

      // Stable Atlas defaults when the URI omitted them.
      if (!parsed.searchParams.has('retryWrites')) {
        parsed.searchParams.set('retryWrites', 'true');
      }
      if (!parsed.searchParams.has('w')) {
        parsed.searchParams.set('w', 'majority');
      }
      if (!parsed.searchParams.has('appName')) {
        parsed.searchParams.set('appName', 'surprise-fashion-sphere');
      }

      return parsed.toString();
    }
  } catch {
    // Fall through with the raw URI if parsing fails.
  }

  return raw;
}

function markConnected() {
  dbState.status = 'connected';
  dbState.lastError = '';
  dbState.lastConnectedAt = new Date().toISOString();
  dbState.reconnectAttempts = 0;
}

function markDisconnected(reason = '') {
  if (dbState.status !== 'connecting') {
    dbState.status = 'disconnected';
  }
  if (reason) {
    dbState.lastError = reason;
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function clearKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

function startKeepAlive() {
  clearKeepAlive();
  keepAliveTimer = setInterval(async () => {
    if (!isDbConnected()) {
      scheduleReconnect('keepalive-miss');
      return;
    }

    try {
      // Lightweight round-trip so silent socket death is detected before user traffic.
      await mongoose.connection.db.admin().command({ ping: 1 });
    } catch (error) {
      markDisconnected(error.message || 'keepalive ping failed');
      console.warn(`MongoDB keepalive failed: ${error.message}`);
      scheduleReconnect('keepalive-error');
    }
  }, KEEP_ALIVE_MS);

  // Do not keep the process alive solely because of the ping timer.
  if (typeof keepAliveTimer.unref === 'function') {
    keepAliveTimer.unref();
  }
}

function reconnectDelayMs(attempt) {
  const exp = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * 400);
  return Math.min(RECONNECT_MAX_MS, exp + jitter);
}

function scheduleReconnect(reason = 'disconnected') {
  if (intentionalClose) return;
  if (!resolveMongoUri()) return;
  if (isDbConnected()) return;
  if (connectPromise) return;
  if (reconnectTimer) return;

  dbState.reconnectAttempts += 1;
  const attempt = dbState.reconnectAttempts;
  const delay = reconnectDelayMs(attempt);
  dbState.status = 'reconnecting';
  console.warn(
    `MongoDB reconnect scheduled in ${delay}ms (attempt ${attempt}, reason: ${reason})`,
  );

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectDB().catch((error) => {
      console.error(`MongoDB reconnect attempt failed: ${error.message}`);
    });
  }, delay);

  if (typeof reconnectTimer.unref === 'function') {
    reconnectTimer.unref();
  }
}

function bindConnectionListeners() {
  if (listenersBound) return;
  listenersBound = true;

  mongoose.connection.on('connected', () => {
    markConnected();
    clearReconnectTimer();
    startKeepAlive();
    console.log(`MongoDB connected (db=${mongoose.connection.name})`);
  });

  mongoose.connection.on('reconnected', () => {
    markConnected();
    clearReconnectTimer();
    startKeepAlive();
    console.log('MongoDB reconnected');
  });

  mongoose.connection.on('disconnected', () => {
    clearKeepAlive();
    if (intentionalClose) {
      markDisconnected('closed intentionally');
      return;
    }
    markDisconnected('disconnected');
    console.warn('MongoDB disconnected — scheduling reconnect');
    scheduleReconnect('disconnected');
  });

  mongoose.connection.on('close', () => {
    clearKeepAlive();
    if (intentionalClose) return;
    markDisconnected('connection closed');
    scheduleReconnect('close');
  });

  mongoose.connection.on('error', (error) => {
    dbState.lastError = error.message;
    console.error(`MongoDB error: ${error.message}`);
    if (!isDbConnected()) {
      markDisconnected(error.message);
      scheduleReconnect('error');
    }
  });
}

/**
 * Establish (or reuse) the MongoDB connection.
 * Safe to call repeatedly — concurrent callers share one in-flight attempt.
 */
export async function connectDB() {
  const uri = resolveMongoUri();

  if (!uri) {
    dbState.status = 'skipped';
    dbState.lastError = 'MONGO_URI is not set';
    console.warn('MONGO_URI is not set. The API is running without a database.');
    return false;
  }

  if (isDbConnected()) {
    markConnected();
    startKeepAlive();
    return true;
  }

  if (connectPromise) {
    return connectPromise;
  }

  intentionalClose = false;
  bindConnectionListeners();
  clearReconnectTimer();
  dbState.status = 'connecting';

  connectPromise = (async () => {
    try {
      mongoose.set('strictQuery', true);
      // Avoid buffering forever if selection fails — surface the error and retry.
      mongoose.set('bufferTimeoutMS', 20_000);

      await mongoose.connect(uri, CONNECT_OPTIONS);
      markConnected();
      startKeepAlive();
      return true;
    } catch (error) {
      markDisconnected(error.message);
      console.error(`MongoDB connection failed: ${error.message}`);

      // Clear a half-open connection so the next attempt can retry cleanly.
      try {
        if (mongoose.connection.readyState !== 0) {
          await mongoose.connection.close(true);
        }
      } catch {
        // ignore
      }

      scheduleReconnect('connect-failed');
      return false;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

/**
 * Wait until connected, with a short retry window for transient Atlas blips.
 * Used by request middleware so a momentary disconnect does not poison the page.
 */
export async function ensureConnected({ retries = 3, waitMs = 750 } = {}) {
  if (isDbConnected()) {
    return true;
  }

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const ok = await connectDB();
    if (ok || isDbConnected()) {
      return true;
    }
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, waitMs * (attempt + 1)));
    }
  }

  return isDbConnected();
}

export async function disconnectDB() {
  intentionalClose = true;
  clearReconnectTimer();
  clearKeepAlive();
  connectPromise = null;
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(true);
  }
  dbState.status = 'disconnected';
}
