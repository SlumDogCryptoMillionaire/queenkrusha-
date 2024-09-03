import { logInfo, logError } from './logger.js';
import { logTrade } from './tradeLogger.js';
import { calculateIndicators } from './indicators.js';
import { getOhlcvData } from './dataManager.js';

let activeTrade = null;  // Track the current active trade

// Function to enter a trade based on a trade signal
export function enterTrade(tradeSignal) {
  if (!tradeSignal || activeTrade) return;  // Prevent entering a new trade if one is already active

  const { type, entryPrice, symbol } = tradeSignal;

  // Define stop loss and take profit levels based on the trade type
  const stopLoss = type === 'long' ? entryPrice - (entryPrice * 0.01) : entryPrice + (entryPrice * 0.01);  // 1% Stop Loss
  const takeProfit = type === 'long' ? entryPrice + (entryPrice * 0.01) : entryPrice - (entryPrice * 0.01);  // 1% Take Profit

  activeTrade = {
    type,
    entryPrice,
    stopLoss,
    takeProfit,
    symbol,
    entryTime: new Date().toISOString(),
  };

  logInfo(`Entered ${type.toUpperCase()} trade for ${symbol} at ${entryPrice}`);
  logTrade(activeTrade, 'entry');  // Log trade entry to a CSV file
}

// Function to exit a trade
function exitTrade(exitPrice) {
  if (!activeTrade) return;

  logInfo(`Exiting ${activeTrade.type.toUpperCase()} trade for ${activeTrade.symbol} at ${exitPrice}`);
  logTrade(activeTrade, 'exit', exitPrice);  // Log trade exit to a CSV file
  activeTrade = null;  // Reset active trade
}

// Function to manage an active trade
export function manageTrade() {
  if (!activeTrade) return;  // No active trade to manage

  const { type, entryPrice, stopLoss, takeProfit, symbol } = activeTrade;
  const ohlcvData = getOhlcvData();  // Retrieve OHLCV data for the symbol

  if (ohlcvData.length === 0) {
    logError('OHLCV data is not loaded. Please load the data first.');
    return;  // Return early if OHLCV data is not loaded
  }

  const { sma3, sma9 } = calculateIndicators(ohlcvData);  // Calculate SMA indicators
  const currentPrice = ohlcvData[ohlcvData.length - 1].close;  // Get the current price

  const sma3Value = sma3[sma3.length - 1];
  const sma9Value = sma9[sma9.length - 1];

  // Determine if we should exit based on stop loss, take profit, or indicator crossing
  let shouldExit = false;
  if (type === 'long') {
    if (currentPrice <= stopLoss || currentPrice >= takeProfit || sma3Value < sma9Value) {
      shouldExit = true;  // Exit if price reaches stop loss, take profit, or SMA3 < SMA9 for long trade
    }
  } else if (type === 'short') {
    if (currentPrice >= stopLoss || currentPrice <= takeProfit || sma3Value > sma9Value) {
      shouldExit = true;  // Exit if price reaches stop loss, take profit, or SMA3 > SMA9 for short trade
    }
  }

  // Exit the trade if conditions are met
  if (shouldExit) {
    exitTrade(currentPrice);
  }
}
