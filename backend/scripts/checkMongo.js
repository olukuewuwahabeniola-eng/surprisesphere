import 'dotenv/config';
import mongoose from 'mongoose';

function redact(uri = '') {
  return String(uri).replace(/\/\/.*@/, '//***@');
}

async function tryConnect(name, uri) {
  console.log(`--- ${name}`);
  console.log(`uri: ${uri ? redact(uri) : '(empty)'}`);
  if (!uri) {
    return false;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });
    console.log(
      `CONNECTED db=${mongoose.connection.name} host=${mongoose.connection.host} ready=${mongoose.connection.readyState}`,
    );
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log(`FAIL ${error.message}`);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    return false;
  }
}

const atlas = process.env.MONGO_URI || '';
const local = process.env.MONGODB_URI || '';
const atlasWithDb =
  atlas && !/mongodb(\+srv)?:\/\/[^/]+\/[^/?]+/.test(atlas)
    ? atlas.replace(/\/?(\?|$)/, '/surprise-fashion-sphere$1')
    : atlas;

await tryConnect('MONGO_URI (as configured)', atlas);
await tryConnect('MONGO_URI (with db name)', atlasWithDb);
await tryConnect('MONGODB_URI (local)', local);
