const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');

let logger;

const initializeLogger = () => {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const logFilename = `tradingbot_log_${timestamp}.log`;

  logger = createLogger({
    level: 'info',
    format: format.combine(format.timestamp(), format.json()),
    transports: [
      new transports.Console(),
      new transports.File({ filename: path.join(__dirname, 'logs', logFilename) }),
    ],
  });
};

const logInfo = (message) => logger.info(message);
const logError = (message) => logger.error(message);

module.exports = { initializeLogger, logInfo, logError };
