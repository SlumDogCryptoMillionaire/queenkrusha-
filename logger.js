import { createLogger, format, transports } from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Simulate __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let logger;  // Declare logger variable

export const initializeLogger = () => {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const logDir = path.join(__dirname, 'logs');
  const logFilename = path.join(logDir, `tradingbot_log_${timestamp}.log`);

  // Create log directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  logger = createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),  // Human-readable timestamp
      format.printf(({ timestamp, message }) => {
        if (typeof message === 'object') {
          // If the message is an object, pretty-print it without extra quotation marks or brackets
          const formattedMessage = Object.entries(message)
            .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`)
            .join('\n');
          return `${timestamp} - ${formattedMessage}`;
        }
        return `${timestamp} - ${message}`;  // Simple string message
      })
    ),
    transports: [
      new transports.Console(),
      new transports.File({ filename: logFilename })
    ],
  });
};

// Improved logInfo function to handle JSON objects directly and avoid backslashes
export const logInfo = (message) => {
  if (!logger) {
    console.error('Logger is not initialized. Call initializeLogger() first.');
    return;
  }

  logger.info(message);  // Directly log the object or string message
};

export const logError = (message) => {
  if (!logger) {
    console.error('Logger is not initialized. Call initializeLogger() first.');
    return;
  }
  logger.error(message);
};
