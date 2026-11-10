import mongoose from 'mongoose';

export const dbState = {
  status: 'disconnected',
  lastError: '',
};

function resolveMongoUri() {
  return process.env.MONGO_URI || process.env.MONGODB_URI || '';
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

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    dbState.status = 'connected';
    dbState.lastError = '';
    console.log('MongoDB connected');
    return true;
  } catch (error) {
    dbState.status = 'disconnected';
    dbState.lastError = error.message;
    console.error(`MongoDB connection failed: ${error.message}`);
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
