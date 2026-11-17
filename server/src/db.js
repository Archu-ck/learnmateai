const mongoose = require('mongoose');
const dns = require('dns');

let mongodInstance = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    if (uri.startsWith('mongodb+srv:')) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch (e) {
        // Continue if dns override is not supported
      }
    }
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
