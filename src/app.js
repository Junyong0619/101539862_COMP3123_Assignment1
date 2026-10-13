const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');

const app = express();

// 1) security headers on every response
app.use(helmet());
// 2) parse JSON bodies
app.use(express.json());
// 3) HTTP request log -> winston (method, path, status, time)
app.use(morgan(':method :url :status - :response-time ms', {
  stream: { write: (msg) => logger.info(msg.trim()) }
}));

// health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

module.exports = app;