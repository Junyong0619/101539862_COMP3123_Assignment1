const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  logger.info(`MongoDB connected: ${mongoose.connection.name}`);
}

module.exports = connectDB;