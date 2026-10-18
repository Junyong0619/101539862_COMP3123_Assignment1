const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');
const rateLimit = require('express-rate-limit');

const app = express();

// On Vercel requests arrive through a proxy; trust it so req.ip (used by the rate limiter)
// is the real client address instead of the proxy address.
if (process.env.VERCEL) app.set('trust proxy', 1);

// security headers on every response
app.use(helmet());
// prevent the unlimited adding auth endpoints: 20 max for 15 min pur IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests, please try again later' },
});
app.use('/api/v1/user', authLimiter);

// parse JSON bodies
app.use(express.json());
// HTTP request log -> winston (method, path, status, time)
app.use(morgan(':method :url :status - :response-time ms', {
  stream: { write: (msg) => logger.info(msg.trim()) }
}));



//Link to UserRoute
const userRoutes = require('./routes/userRoutes');
app.use('/api/v1/user', userRoutes);
//link to employeeRoute
const employeeRoutes = require('./routes/employeeRoutes');
app.use('/api/v1/emp', employeeRoutes);

// health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});


//error handler
const { notFound, errorHandler } = require('./middleware/errorHandler');
app.use(notFound);
app.use(errorHandler);


module.exports = app;