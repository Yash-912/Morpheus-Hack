// ============================================================
// Logger Utility — Winston structured logging
// Console (dev) + File (prod) transports
// ============================================================

const winston = require('winston');
const path = require('path');

const LOG_LEVEL = process.env.LOG_LEVEL || 'debug';
const IS_PROD = process.env.NODE_ENV === 'production';

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// Structured JSON format for file/production output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Transports
const transports = [];

if (IS_PROD) {
  // Production: JSON files
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    })
  );
} else {
  // Development: colorized console
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

const logger = winston.createLogger({
  level: LOG_LEVEL,
  defaultMeta: { service: 'gigpay-backend' },
  transports,
  // Don't exit on unhandled errors
  exitOnError: false,
});

// Add stream method for Morgan integration
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
