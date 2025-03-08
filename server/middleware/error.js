const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  logger.error(err.stack);

  // Check if the error has a status code, otherwise default to 500
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
}; 