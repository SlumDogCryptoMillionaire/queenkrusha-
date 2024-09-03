import { logInfo, logError } from './logger.js';
import { logTrade, calculateGainLoss, initializeTradeLogger } from './tradeLogger.js';

// Initialize trade logging
let tradeCounter = 1;  // Counter for unique trade IDs
const tradeLogFile = initializeTradeLogger();  // Create a new CSV file for each run

// Store open trades
const openTrades = [];

// Function to enter a trade
export const enterTrade = (tradeType, entryTime, entryPrice) => {
  // Check if a trade of any type is already open
  const existingTrade = openTrades.find(trade => trade.exitTime === null);
  
  if (existingTrade) {
    logInfo(`A ${existingTrade.tradeType} trade is already open for BTC/USDT. Skipping entry of ${tradeType} trade.`);
    return;  // Do not enter a new trade if one is already open
  }

  // Log entry with correct values
  logInfo(`Entered ${tradeType} trade for BTC/USDT at ${entryPrice}`);

  // Create a new trade object
  const newTrade = {
    tradeID: tradeCounter++,
    tradeType: tradeType,
    entryTime: entryTime,
    entryPrice: entryPrice,
    exitTime: null,
    exitPrice: null,
    gainLoss: null,
  };

  // Store the open trade
  openTrades.push(newTrade);

  // Log trade to CSV file
  logTrade(tradeLogFile, newTrade);  // Ensure the trade is logged to CSV when entered
};

// Function to exit a trade
export const exitTrade = (tradeType, exitTime, exitPrice) => {
  // Find the last open trade of the same type
  const openTradeIndex = openTrades.findIndex(trade => trade.tradeType === tradeType && trade.exitTime === null);
  
  if (openTradeIndex !== -1) {
    const openTrade = openTrades[openTradeIndex];

    // Update trade details with exit information
    openTrade.exitTime = exitTime;
    openTrade.exitPrice = exitPrice;
    openTrade.gainLoss = calculateGainLoss(tradeType, openTrade.entryPrice, exitPrice);

    // Log the completed trade to the CSV file
    logTrade(tradeLogFile, openTrade);

    // Correct log message
    logInfo(`Exiting ${tradeType} trade for BTC/USDT at ${exitPrice}. Gain/Loss: ${openTrade.gainLoss}`);

    // Remove the trade from open trades
    openTrades.splice(openTradeIndex, 1);
  } else {
    logError(`No open ${tradeType} trade found to exit.`);
  }
};

// Function to check for trade signals and manage trades
export const manageTrade = (symbol, price, macdHistValue, sma3Value, sma9Value) => {
  if (macdHistValue > 0 && sma3Value > sma9Value) {
    // Generate a long signal
    const entryTime = new Date().toISOString();
    const tradeType = 'LONG';

    // Check if there's already an open trade
    const existingTrade = openTrades.find(trade => trade.exitTime === null);
    if (!existingTrade) {
      enterTrade(tradeType, entryTime, price);  // Ensure correct parameters are passed
    } else {
      logInfo(`A ${existingTrade.tradeType} trade is already open for BTC/USDT. Skipping entry of LONG trade.`);
    }
  } else if (macdHistValue < 0 && sma3Value < sma9Value) {
    // Generate a short signal
    const entryTime = new Date().toISOString();
    const tradeType = 'SHORT';

    // Check if there's already an open trade
    const existingTrade = openTrades.find(trade => trade.exitTime === null);
    if (!existingTrade) {
      enterTrade(tradeType, entryTime, price);  // Ensure correct parameters are passed
    } else {
      logInfo(`A ${existingTrade.tradeType} trade is already open for BTC/USDT. Skipping entry of SHORT trade.`);
    }
  } else {
    // Exit any existing trades if the conditions change
    const exitTime = new Date().toISOString();
    
    // Exit LONG trade if conditions are met
    const existingLongTrade = openTrades.find(trade => trade.tradeType === 'LONG' && trade.exitTime === null);
    if (existingLongTrade) {
      exitTrade('LONG', exitTime, price);  // Ensure correct parameters are passed
    }

    // Exit SHORT trade if conditions are met
    const existingShortTrade = openTrades.find(trade => trade.tradeType === 'SHORT' && trade.exitTime === null);
    if (existingShortTrade) {
      exitTrade('SHORT', exitTime, price);  // Ensure correct parameters are passed
    }
  }
};
