import { logInfo, logError } from './logger.js';
import { calculateIndicators } from './indicators.js';

let pendingSignal = null;  // Variable to store pending signal

export const analyzeMarket = (ohlcv, symbol) => {
  const { sma3, sma9, macd } = calculateIndicators(ohlcv);
  const lastCandle = ohlcv[ohlcv.length - 1];

  if (!lastCandle || lastCandle.close === undefined || isNaN(lastCandle.close)) {
    logError(`Invalid last candle data for ${symbol}. Skipping analysis.`);
    return null;
  }

  const price = lastCandle.close;
  const sma3Value = sma3[sma3.length - 1] || 0;
  const sma9Value = sma9[sma9.length - 1] || 0;
  const macdHistValue = macd.histogram[macd.histogram.length - 1] || 0;

  logInfo(`Symbol: ${symbol}, Price: ${price}, MACD Histogram: ${macdHistValue.toFixed(2)}, SMA 3: ${sma3Value.toFixed(2)}, SMA 9: ${sma9Value.toFixed(2)}`);

  if (macdHistValue > 0 && sma3Value > sma9Value) {
    logInfo(`Confirmed Long signal for ${symbol} at price ${price}`);
    pendingSignal = { type: 'long', entryPrice: price, symbol };
    return pendingSignal;
  }

  if (macdHistValue < 0 && sma3Value < sma9Value) {
    logInfo(`Confirmed Short signal for ${symbol} at price ${price}`);
    pendingSignal = { type: 'short', entryPrice: price, symbol };
    return pendingSignal;
  }

  // Log no signal found
  logInfo(`No trade signal generated for ${symbol} at current price ${price}.`);
  return null;
};

// Function to get the current pending signal
export const getPendingSignal = () => {
  if (pendingSignal) {
    logInfo(`Pending signal available: ${pendingSignal.type.toUpperCase()} at ${pendingSignal.entryPrice}`);
  } else {
    logInfo('No pending signal available.');
  }
  return pendingSignal;
};

// Function to reset the pending signal
export const resetPendingSignal = () => {
  logInfo('Resetting pending signal.');
  pendingSignal = null;
};
