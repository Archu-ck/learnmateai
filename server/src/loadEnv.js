const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Prioritize root .env (../../.env from server/src)
const rootEnv = path.resolve(__dirname, '../../.env');
const serverEnv = path.resolve(__dirname, '../.env');

if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv, override: true });
} else if (fs.existsSync(serverEnv)) {
  dotenv.config({ path: serverEnv, override: true });
} else {
  dotenv.config();
}

module.exports = process.env;
