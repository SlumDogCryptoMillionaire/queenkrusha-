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
    format: format.combine(format.timestamp(), format.json()),
    transports: [
      new transports.Console(),
      new transports.File({ filename: logFilename })
    ],
  });
};

// Updated logInfo function to handle pretty-printing of JSON
export const logInfo = (message) => {
  if (!logger) {
    console.error('Logger is not initialized. Call initializeLogger() first.');
    return;
  }

  if (typeof message === 'object') {
    // Pretty print JSON objects
    logger.info(JSON.stringify(message, null, 2));
  } else {
    logger.info(message);
  }
};

export const logError = (message) => {
  if (!logger) {
    console.error('Logger is not initialized. Call initializeLogger() first.');
    return;
  }
  logger.error(message);
};
