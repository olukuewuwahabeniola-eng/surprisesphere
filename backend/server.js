import app, { ensureDb } from './app.js';
import { dbState } from './config/db.js';

const port = Number(process.env.PORT) || 5050;

async function start() {
  await ensureDb();

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
