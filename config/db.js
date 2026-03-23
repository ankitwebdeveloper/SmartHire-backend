const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    const primaryUri = process.env.MONGO_URI;
    if (!primaryUri) {
      throw new Error('MONGO_URI is not set');
    }

    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 15000,
      family: 4, // prefer IPv4 (helps on some Windows/DNS setups)
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    const isDev = (process.env.NODE_ENV || 'development') === 'development';

    if (!isDev) {
      console.error(`Error: ${error.message}`);
      process.exit(1); // Exit process with failure
    }

    console.warn(`MongoDB connection failed (${error.message}). Trying fallback URI, then local MongoDB, then in-memory for development.`);

    // 0) Optional fallback URI (useful when SRV/DNS is blocked)
    const fallbackUri = process.env.MONGO_URI_FALLBACK;
    if (fallbackUri) {
      try {
        const conn = await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 15000,
          family: 4,
        });
        console.log(`MongoDB Connected (fallback): ${conn.connection.host}`);
        return;
      } catch (fallbackErr) {
        console.warn(`Fallback MongoDB connection failed (${fallbackErr.message}).`);
      }
    }

    // 1) Try local MongoDB for persistence in dev
    const localUri = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/smarthire';
    try {
      const conn = await mongoose.connect(localUri, {
        serverSelectionTimeoutMS: 5000,
        family: 4,
      });
      console.log(`MongoDB (local) Connected: ${conn.connection.host}`);
      return;
    } catch (localErr) {
      console.warn(`Local MongoDB connection failed (${localErr.message}). Using in-memory MongoDB.`);
    }

    // 2) Fall back to in-memory MongoDB
    const mongoServer = await MongoMemoryServer.create({
      instance: {
        // Some Windows machines need longer than the default 10s to spawn mongod
        launchTimeout: 60_000,
      },
    });
    const memUri = mongoServer.getUri();
    const conn = await mongoose.connect(memUri);
    console.log(`MongoDB (memory) Connected: ${conn.connection.host}`);
  }
};

module.exports = connectDB;
