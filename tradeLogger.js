const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
const { logInfo, logError } = require('./logger');

let tradesCsvWriter = null;

const initializeTradeLogger = (symbol) => {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const filename = `${symbol.replace('/', '')}_trades_${timestamp}.csv`;
  const filePath = path.join(__dirname, 'logs', filename);

  // Ensure logs directory exists
  if (!fs.existsSync(path.join(__dirname, 'logs'))) {
    fs.mkdirSync(path.join(__dirname, 'logs'));
  }

  tradesCsvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'timestamp', title: 'Timestamp' },
      { id: 'symbol', title: 'Symbol' },
      { id: 'type', title: 'Type' },
      { id: 'action', title: 'Action' }, // Entry or Exit
      { id: 'price', title: 'Price' },
      { id: 'stopLoss', title: 'Stop Loss' },
      { id: 'takeProfit', title: 'Take Profit' },
      { id: 'result', title: 'Result' },
    ],
  });

  logInfo(`Initialized trade logger for ${symbol}`);
};

const logTrade = async (trade, action, exitPrice = null) => {
  // Format numeric values to two decimal places
  const formatToTwoDecimals = (value) => (value !== null && value !== undefined ? parseFloat(value).toFixed(2) : null);

  const result = action === 'exit' ? (trade.type === 'long' ? exitPrice - trade.entryPrice : trade.entryPrice - exitPrice) : null;
  const tradeData = {
    timestamp: new Date().toISOString(),
    symbol: trade.symbol,
    type: trade.type,
    action: action,
    price: formatToTwoDecimals(action === 'entry' ? trade.entryPrice : exitPrice),
    stopLoss: formatToTwoDecimals(trade.stopLoss),
    takeProfit: formatToTwoDecimals(trade.takeProfit),
    result: result !== null ? formatToTwoDecimals(result) : null,
  };

  try {
    await tradesCsvWriter.writeRecords([tradeData]);
    // Log the trade data using console.dir to avoid escape characters and newlines
    console.log(`Trade ${action} logged:`);
    console.dir(tradeData, { depth: null, colors: true });  // This will print a well-formatted output to the console
  } catch (error) {
    logError('Error writing trade to CSV:', error);
  }
};

module.exports = { initializeTradeLogger, logTrade };
