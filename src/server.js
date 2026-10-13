require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => logger.info(`Server started on port ${PORT}`));
  })
  .catch((err) => {
    logger.error(`Failed to start: ${err.message}`);
    process.exit(1);
  });