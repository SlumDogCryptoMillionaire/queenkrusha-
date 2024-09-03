import fs from 'fs'; 
import { createLogger, format, transports } from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

// Simulate __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let logger;  // Declare logger variable

export const initializeLogger = () => {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const logFilename = path.join(__dirname, 'logs', `tradingbot_log_${timestamp}.log`);

  if (!fs.existsSync(path.join(__dirname, 'logs'))) {
    fs.mkdirSync(path.join(__dirname, 'logs'));
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

export const logInfo = (message) => {
  if (!logger) {
    console.error('Logger is not initialized. Call initializeLogger() first.');
    return;
  }
  logger.info(message);
};

export const logError = (message) => {
  if (!logger) {
    console.error('Logger is not initialized. Call initializeLogger() first.');
    return;
  }
  logger.error(message);
};
