import app, { ensureDb } from './app.js';
import { dbState } from './config/db.js';

const port = Number(process.env.PORT) || 5050;

async function start() {
  // Listen first so the API stays reachable even while Atlas is reconnecting.
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
    console.log(`Database status: ${dbState.status}`);
  });

  const connected = await ensureDb();
  console.log(`Database status: ${dbState.status}`);
  if (!connected) {
    console.warn(
      'MongoDB is not connected yet. Background reconnect is active; seed fallback may serve until it recovers.',
    );
  }
}

start().catch((error) => {
  console.error(`API failed to start: ${error.message}`);
  process.exit(1);
});
