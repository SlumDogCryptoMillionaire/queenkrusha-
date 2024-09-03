import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logInfo, logError } from './logger.js';

// Simulate __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tradeLog = [];  // Initialize an array to store trades for each run
const logDir = path.join(__dirname, 'logs');

// Function to initialize the trade logger CSV file
export const initializeTradeLogger = () => {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const logFilename = path.join(logDir, `trades_log_${timestamp}.csv`);

  // Write the header row to the CSV file
  fs.writeFileSync(logFilename, 'Trade ID,Trade Type,Entry Time,Entry Price,Exit Time,Exit Price,Gain/Loss\n', 'utf8');

  return logFilename;
};

// Function to log a trade to the CSV file
export const logTrade = (tradeLogFile, trade) => {
  try {
    const { tradeID, tradeType, entryTime, entryPrice, exitTime, exitPrice, gainLoss } = trade;
    const tradeRow = `${tradeID},${tradeType},${entryTime},${entryPrice},${exitTime},${exitPrice},${gainLoss}\n`;

    fs.appendFileSync(tradeLogFile, tradeRow, 'utf8');  // Append the trade to the CSV file

    logInfo(`Trade logged: ${tradeRow}`);
  } catch (error) {
    logError(`Error logging trade: ${error.message}`);
  }
};

// Function to calculate gain/loss for a trade
export const calculateGainLoss = (tradeType, entryPrice, exitPrice) => {
  return tradeType === 'LONG' ? exitPrice - entryPrice : entryPrice - exitPrice;
};
