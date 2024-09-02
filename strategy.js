const { calculateIndicators } = require('./indicators');
const { logInfo } = require('./logger');

let pendingSignal = null;  // Store the pending signal until the next candle closes
let hasActiveTrade = false; // Flag to track if there is an active trade
const MIN_SEPARATION_THRESHOLD = 0.0005; // Example: 0.05% of the price
const EXTREME_VOLUME_THRESHOLD = 3.0; // Extreme volume threshold for exit

// Calculate the delta of buy and sell volumes
const calculateVolumeDelta = (buyVolume, sellVolume) => {
  return buyVolume - sellVolume;  // Delta = Buy Volume - Sell Volume
};

const analyzeMarket = (ohlcv, symbol, buyVolume, sellVolume) => {
  try {
    // Return if there is already an active trade
    if (hasActiveTrade) {
      logInfo('Skipping signal generation; there is already an active trade.');
      return null;
    }

    const { sma3, sma9, macd } = calculateIndicators(ohlcv);
    const lastCandle = ohlcv[ohlcv.length - 1];
    const price = lastCandle.close;
    const sma3Value = sma3[sma3.length - 1];
    const sma9Value = sma9[sma9.length - 1];
    const macdHistValue = macd.histogram[macd.histogram.length - 1];
    const separation = Math.abs(sma3Value - sma9Value) / price;  // Separation between SMAs as a fraction of price
    const volumeDelta = calculateVolumeDelta(buyVolume, sellVolume);  // Calculate the volume delta

    // Log the volume delta with other values
    logInfo(`Symbol: ${symbol}, Price: ${price}, Volume Delta: ${volumeDelta.toFixed(2)}, Trade Signal: No, MACD Histogram: ${macdHistValue.toFixed(2)}, SMA 3: ${sma3Value.toFixed(2)}, SMA 9: ${sma9Value.toFixed(2)}, Buy Volume: ${buyVolume.toFixed(2)}, Sell Volume: ${sellVolume.toFixed(2)}`);

    // Skip signals if the SMAs are too close together
    //if (separation < MIN_SEPARATION_THRESHOLD) {
    //  logInfo(`Skipping trade signal due to SMAs being too close together: SMA 3: ${sma3Value.toFixed(2)}, SMA 9: ${sma9Value.toFixed(2)}, Separation: ${separation.toFixed(4)}`);
    //  return null;
    //}

    // Long trade signal when SMA 3 > SMA 9, MACD Histogram > 0, Buy Volume > Sell Volume, and Volume Delta > 0
    if (sma3Value > sma9Value && macdHistValue > 0 && buyVolume > sellVolume && volumeDelta > 0) {
      logInfo(`Confirmed Long signal for ${symbol} with SMA 3: ${sma3Value.toFixed(2)}, SMA 9: ${sma9Value.toFixed(2)}, MACD Histogram: ${macdHistValue.toFixed(2)}, Buy Volume: ${buyVolume.toFixed(2)}, Sell Volume: ${sellVolume.toFixed(2)}, Volume Delta: ${volumeDelta.toFixed(2)}`);
      pendingSignal = {
        type: 'long',
        entryPrice: price,
        stopLoss: ohlcv[ohlcv.length - 2].low,  // Low of the previous candle
        takeProfit: price + (price - ohlcv[ohlcv.length - 2].low) * 2,
        symbol,
      };
    }

    // Short trade signal when SMA 3 < SMA 9, MACD Histogram < 0, Sell Volume > Buy Volume, and Volume Delta < 0
    if (sma3Value < sma9Value && macdHistValue < 0 && sellVolume > buyVolume && volumeDelta < 0) {
      logInfo(`Confirmed Short signal for ${symbol} with SMA 3: ${sma3Value.toFixed(2)}, SMA 9: ${sma9Value.toFixed(2)}, MACD Histogram: ${macdHistValue.toFixed(2)}, Buy Volume: ${buyVolume.toFixed(2)}, Sell Volume: ${sellVolume.toFixed(2)}, Volume Delta: ${volumeDelta.toFixed(2)}`);
      pendingSignal = {
        type: 'short',
        entryPrice: price,
        stopLoss: ohlcv[ohlcv.length - 2].high,  // High of the previous candle
        takeProfit: price - (ohlcv[ohlcv.length - 2].high - price) * 2,
        symbol,
      };
    }

  } catch (error) {
    console.error('Error analyzing market:', error.message);
  }

  return pendingSignal;  // Return the pending signal for the next candle
};

const getPendingSignal = () => pendingSignal;  // Function to get the pending signal

const resetPendingSignal = () => { pendingSignal = null; };  // Reset pending signal after trade entry

const setActiveTradeStatus = (status) => { hasActiveTrade = status; }; // Function to set active trade status

module.exports = { analyzeMarket, getPendingSignal, resetPendingSignal, setActiveTradeStatus, calculateVolumeDelta };
