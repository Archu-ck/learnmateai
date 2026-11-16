const mongoose = require('mongoose');

let mongodInstance = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      await mongoose.connect(uri);
      console.log('Connected to MongoDB via MONGODB_URI');
      return;
    } catch (err) {
      console.warn('Failed to connect to MONGODB_URI, falling back to in-memory MongoDB...', err.message);
    }
  }

  // Fallback to in-memory MongoDB
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const memoryUri = mongodInstance.getUri();
    await mongoose.connect(memoryUri);
    console.log(`Connected to in-memory MongoDB at ${memoryUri}`);
  } catch (err) {
    console.error('Failed to initialize MongoDB connection:', err);
    throw err;
  }
}

async function closeDB() {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
}

module.exports = { connectDB, closeDB };
