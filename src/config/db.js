const mongoose = require('mongoose');
const logger = require('../utils/logger');

// On Vercel the same process can handle many requests, so reuse one connection
// instead of opening a new one on every invocation.
let connecting = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGODB_URI)
      .then((m) => {
        logger.info(`MongoDB connected: ${mongoose.connection.name}`);
        return m.connection;
      })
      .catch((err) => {
        connecting = null;
        throw err;
      });
  }
  return connecting;
}

module.exports = connectDB;
