// Vercel serverless entry point.
// Vercel does not run src/server.js (no long-lived app.listen); instead every HTTP request
// invokes this function. We reuse the same Express app and make sure the MongoDB
// connection is open (connectDB caches the connection between invocations).
require('dotenv').config();
const app = require('../src/app');
const connectDB = require('../src/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ status: 'error', message: 'Database connection failed' }));
  }
  return app(req, res);
};
