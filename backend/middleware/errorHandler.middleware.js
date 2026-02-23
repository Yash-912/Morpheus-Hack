// ============================================================
// Global Error Handler Middleware
// Catches all unhandled errors, maps Prisma errors, logs, responds
// ============================================================

const { Prisma } = require('@prisma/client');
const logger = require('../utils/logger.utils');

/**
 * Express error-handling middleware (4 args).
 * Place as the LAST middleware in the chain.
 */
function errorHandler(err, req, res, _next) {
  // Default error shape
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = null;

  // ---- Prisma Errors ----
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid data provided';
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // Unique constraint violation
        statusCode = 409;
        code = 'DUPLICATE_ENTRY';
        message = `A record with this ${err.meta?.target?.join(', ') || 'value'} already exists`;
        break;
      case 'P2003': // Foreign key constraint failure
        statusCode = 400;
        code = 'INVALID_REFERENCE';
        message = 'Referenced record does not exist';
        break;
      case 'P2025': // Record not found
        statusCode = 404;
        code = 'NOT_FOUND';
        message = 'Record not found';
        break;
      default:
        statusCode = 400;
        code = 'DATABASE_ERROR';
        message = 'Database operation failed';
    }
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    code = 'DATABASE_UNAVAILABLE';
    message = 'Database connection failed';
  }

  // ---- JSON Parse Error ----
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Request body contains invalid JSON';
  }

  // ---- Log ----
  if (statusCode >= 500) {
    logger.error(`[${code}] ${message}`, {
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id,
    });
  } else {
    logger.warn(`[${code}] ${message}`, {
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id,
    });
  }

  // ---- Response ----
  const response = {
    success: false,
    error: { code, message },
  };

  // Include stack trace in development only
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.error.stack = err.stack;
  }

  if (details) {
    response.error.details = details;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
