import 'dotenv/config';
import mongoose from 'mongoose';

async function inspectUri(uri, label) {
  console.log(`\n=== ${label} ===`);
  console.log('uri:', String(uri).replace(/\/\/.*@/, '//***@'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  console.log('db name:', db.databaseName);
  const collections = await db.listCollections().toArray();
  console.log(
    'collections:',
    collections.map((item) => item.name).join(', ') || '(none)',
  );
  for (const name of ['products', 'categories', 'reviews', 'reviewphotos', 'stores', 'users']) {
    try {
      const count = await db.collection(name).countDocuments();
      console.log(`${name}: ${count}`);
    } catch {
      console.log(`${name}: (missing)`);
    }
  }
  await mongoose.disconnect();
}

const base = (process.env.MONGO_URI || '').trim();
if (!base) {
  console.error('MONGO_URI missing');
  process.exit(1);
}

const hasDbName = /mongodb(?:\+srv)?:\/\/[^/]+\/[^/?]+/.test(base);
const sphereUri = hasDbName
  ? base
  : base.replace(/\/?(\?|$)/, '/surprise-fashion-sphere$1');
const testUri = hasDbName
  ? base.replace(/\/([^/?]+)(\?|$)/, '/test$2')
  : base.replace(/\/?(\?|$)/, '/test$1');

await inspectUri(base, 'configured MONGO_URI (default db)');
await inspectUri(sphereUri, 'surprise-fashion-sphere');
await inspectUri(testUri, 'test');
