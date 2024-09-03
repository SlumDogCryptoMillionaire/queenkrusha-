import { logInfo, logError } from './logger.js';
import { calculateIndicators } from './indicators.js';

let pendingSignal = null;  // Variable to store pending signal

export const analyzeMarket = (ohlcv, symbol) => {
  const { sma3, sma9, macd, atr } = calculateIndicators(ohlcv);
  const lastCandle = ohlcv[ohlcv.length - 1];

  if (!lastCandle || lastCandle.close === undefined || isNaN(lastCandle.close)) {
    logError(`Invalid last candle data for ${symbol}. Skipping analysis.`);
    return null;
  }

  const price = lastCandle.close;
  const sma3Value = sma3[sma3.length - 1] || 0;
  const sma9Value = sma9[sma9.length - 1] || 0;
  const macdHistValue = macd.histogram[macd.histogram.length - 1] || 0;
  const atrValue = atr[atr.length - 1] || 0;  // Get the latest ATR value

  logInfo(`Symbol: ${symbol}, Price: ${price}, MACD Histogram: ${macdHistValue.toFixed(2)}, SMA 3: ${sma3Value.toFixed(2)}, SMA 9: ${sma9Value.toFixed(2)}, ATR(14): ${atrValue.toFixed(2)}`);

  // Determine stop loss and take profit levels based on trade type
  let stopLossLevel, takeProfitLevel;

  if (macdHistValue > 0 && sma3Value > sma9Value) {
    // Long position: Stop loss 2x ATR below, take profit 2x ATR above
    stopLossLevel = price - (2 * atrValue);
    takeProfitLevel = price + (2 * atrValue);
    
    logInfo(`Confirmed Long signal for ${symbol} at price ${price}`);
    pendingSignal = { type: 'long', entryPrice: price, stopLoss: stopLossLevel, takeProfit: takeProfitLevel, symbol };
    return pendingSignal;
  }

  if (macdHistValue < 0 && sma3Value < sma9Value) {
    // Short position: Stop loss 2x ATR above, take profit 2x ATR below
    stopLossLevel = price + (2 * atrValue);
    takeProfitLevel = price - (2 * atrValue);
    
    logInfo(`Confirmed Short signal for ${symbol} at price ${price}`);
    pendingSignal = { type: 'short', entryPrice: price, stopLoss: stopLossLevel, takeProfit: takeProfitLevel, symbol };
    return pendingSignal;
  }

  logInfo(`No trade signal generated for ${symbol} at current price ${price}.`);
  return null;
};

// Function to get the current pending signal
export const getPendingSignal = () => pendingSignal;

// Function to reset the pending signal
export const resetPendingSignal = () => {
  logInfo('Resetting pending signal.');
  pendingSignal = null;
};
