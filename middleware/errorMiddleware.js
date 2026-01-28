const logger = require('../utils/logger');
const { errorResponse } = require('../utils/responseHandler');

module.exports = (err, req, res, next) => {
  logger.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    return errorResponse(res, 400, 'Validation Error', err.errors);
  }

  if (err.name === 'CastError') {
    return errorResponse(res, 400, 'Invalid ID format');
  }

  if (err.code === 11000) {
    return errorResponse(res, 400, 'Duplicate field value');
  }

  errorResponse(res, statusCode, message);
};
