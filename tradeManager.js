const { logInfo } = require('./logger');
const { logTrade } = require('./tradeLogger');
const { setActiveTradeStatus } = require('./strategy'); // Import to update active trade status
const { calculateIndicators } = require('./indicators'); // Import indicators
const { getOhlcvData } = require('./dataManager'); // Import getOhlcvData correctly

let activeTrade = null;
// const TRAILING_STOP_PERCENTAGE = 0.01; // Example: 1% trailing stop

const enterTrade = (tradeSignal) => {
  if (!tradeSignal || activeTrade) return;  // Do not enter a new trade if there is already an active trade

  const { type, entryPrice, stopLoss, takeProfit, symbol } = tradeSignal;

  activeTrade = {
    type,
    entryPrice,
    stopLoss,
    takeProfit,
    symbol,
    entryTime: new Date().toISOString(),
    // trailingStop: null,  // Initialize trailing stop as null
  };

  setActiveTradeStatus(true);  // Mark as having an active trade
  logInfo(`Entered ${type.toUpperCase()} trade for ${symbol} at ${entryPrice}`);
  logTrade(activeTrade, 'entry');  // Log trade entry to CSV

  // Immediately check if the entry conditions are invalidated
  const ohlcvData = getOhlcvData(symbol); // Correctly get OHLCV data
  const { sma3, sma9 } = calculateIndicators(ohlcvData); // Calculate indicators using OHLCV data
  const sma3Value = sma3[sma3.length - 1];
  const sma9Value = sma9[sma9.length - 1];

  if ((type === 'long' && sma3Value < sma9Value) || (type === 'short' && sma3Value > sma9Value)) {
    logInfo(`Immediate exit for ${type.toUpperCase()} trade for ${symbol} at ${entryPrice} due to unfavorable SMA crossover.`);
    exitTrade(entryPrice);  // Exit immediately
  }
};

/*
const updateTrailingStop = (trade, currentPrice) => {
  const { type, trailingStop, stopLoss } = trade;  // Include stopLoss in destructuring
  let newTrailingStop;

  if (type === 'short') {
    // Calculate new trailing stop for short (only move downwards)
    newTrailingStop = currentPrice * (1 + TRAILING_STOP_PERCENTAGE);
    if (!trailingStop || newTrailingStop < trailingStop) {
      trade.trailingStop = newTrailingStop;
      logInfo(`Updated trailing stop for SHORT trade to ${trade.trailingStop.toFixed(2)}`);
    }
  } else if (type === 'long') {
    // Calculate new trailing stop for long (only move upwards)
    newTrailingStop = currentPrice * (1 - TRAILING_STOP_PERCENTAGE);

    // Ensure trailing stop does not move below initial stop loss or previous trailing stop
    if ((!trailingStop || newTrailingStop > trailingStop) && newTrailingStop > stopLoss) {
      trade.trailingStop = newTrailingStop;
      logInfo(`Updated trailing stop for LONG trade to ${trade.trailingStop.toFixed(2)}`);
    }
  }
};
*/

const exitTrade = (exitPrice) => {
  if (!activeTrade) return;
  
  logInfo(`Exiting ${activeTrade.type.toUpperCase()} trade for ${activeTrade.symbol} at ${exitPrice}`);
  logTrade(activeTrade, 'exit', exitPrice);  // Log trade exit to CSV
  activeTrade = null;  // Reset active trade
  setActiveTradeStatus(false);  // Mark as not having an active trade
};

const manageTrade = (ohlcv, buyVolume, sellVolume) => {
  if (!activeTrade) return;

  const { type, entryPrice, stopLoss, takeProfit, symbol } = activeTrade;
  const price = ohlcv[ohlcv.length - 1].close;  // Current close price

  const { sma3, sma9 } = calculateIndicators(ohlcv);
  const sma3Value = sma3[sma3.length - 1];
  const sma9Value = sma9[sma9.length - 1];

  let shouldExitTrade = false;

  if (type === 'short') {
    // updateTrailingStop(activeTrade, price); // Commented out trailing stop logic

    if (price >= stopLoss || /* price >= activeTrade.trailingStop || */ sma3Value > sma9Value) {
      logInfo(`Exiting SHORT trade for ${symbol} at ${price} due to ${
        price >= stopLoss ? 'stop loss' : /* (price >= activeTrade.trailingStop ? 'trailing stop' : */ 'SMA 3 crossing above SMA 9'
      }`);
      shouldExitTrade = true;
    }
  } else if (type === 'long') {
    // updateTrailingStop(activeTrade, price); // Commented out trailing stop logic

    // Immediate exit if SMA 3 crosses below SMA 9
    if (sma3Value < sma9Value) {
      logInfo(`Exiting LONG trade for ${symbol} at ${price} due to SMA 3 crossing below SMA 9`);
      shouldExitTrade = true;
    } else if (price <= stopLoss /* || price <= activeTrade.trailingStop */) {
      logInfo(`Exiting LONG trade for ${symbol} at ${price} due to ${
        price <= stopLoss ? 'stop loss' : '' // Removed trailing stop condition
      }`);
      shouldExitTrade = true;
    }
  }

  if (shouldExitTrade) {
    exitTrade(price);
  }
};

module.exports = { enterTrade, manageTrade };
