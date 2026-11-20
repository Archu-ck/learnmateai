require('./loadEnv');
const path = require('path');
const http = require('http');
const app = require('./app');
const { connectDB } = require('./db');
const User = require('./models/User');
const { seedDatabase } = require('./seed');
const { initSocket } = require('./services/socketService');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    // Auto-seed if database is fresh
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Fresh database detected. Auto-seeding initial roles and users...');
      await seedDatabase();
    }

    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`LearnMate Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
