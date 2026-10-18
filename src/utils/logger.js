const winston = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '..', '..', 'logs');

const transports = [new winston.transports.Console()];

// Local run: also write logs/app.log and logs/error.log.
// Vercel (serverless) has a read-only file system, so only the console transport is used there;
// the output is visible in the Vercel "Logs" tab.
if (!process.env.VERCEL) {
  transports.push(
    new winston.transports.File({ filename: path.join(logDir, 'app.log') }),
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' })
  );
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`)
  ),
  transports
});

module.exports = logger;
