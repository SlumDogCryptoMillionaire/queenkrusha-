import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Simulate __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to sanitize file names by replacing invalid characters
const sanitizeFileName = (name) => name.replace(/[\/\\?%*:|"<>]/g, '_');  // Replace invalid characters with '_'

// Initialize trade logging
export const initializeTradeLogger = (symbol) => {
  const sanitizedSymbol = sanitizeFileName(symbol);  // Sanitize the symbol name
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const logDir = path.join(__dirname, 'logs');
  const logFilename = path.join(logDir, `trades_${sanitizedSymbol}_${timestamp}.csv`);

  // Create log directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  // Create log file with headers if it doesn't exist
  if (!fs.existsSync(logFilename)) {
    const header = 'Timestamp,Type,Symbol,EntryPrice,StopLoss,TakeProfit,Status\n';
    fs.writeFileSync(logFilename, header);
  }

  return logFilename;  // Return the filename for logging trades
};

// Function to log trades
export const logTrade = (trade, type, exitPrice = null) => {
  const timestamp = new Date().toISOString();
  const logFilename = initializeTradeLogger(trade.symbol);
  
  let tradeEntry = '';
  if (type === 'entry') {
    tradeEntry = `${timestamp},${trade.type},${trade.symbol},${trade.entryPrice},${trade.stopLoss},${trade.takeProfit},${type}\n`;
  } else if (type === 'exit' && exitPrice !== null) {
    tradeEntry = `${timestamp},${trade.type},${trade.symbol},${trade.entryPrice},${trade.stopLoss},${trade.takeProfit},${type},Exit Price: ${exitPrice}\n`;
  }

  fs.appendFileSync(logFilename, tradeEntry);
};
