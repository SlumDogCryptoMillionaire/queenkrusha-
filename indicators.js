import { createRequire } from 'module';  // Use createRequire to require CommonJS modules in ESM
const require = createRequire(import.meta.url);
const talib = require('talib');

export const calculateSMA = (closePrices, period) => {
  if (!Array.isArray(closePrices) || closePrices.length < period) {
    console.error(`Insufficient data for SMA calculation. Required: ${period}, Provided: ${closePrices.length}`);
    return [];
  }
  
  return talib.execute({
    name: 'SMA',
    startIdx: 0,
    endIdx: closePrices.length - 1,
    inReal: closePrices,
    optInTimePeriod: period,
  }).result.outReal;
};

export const calculateMACD = (closePrices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  if (!Array.isArray(closePrices) || closePrices.length < slowPeriod) {
    console.error(`Insufficient data for MACD calculation. Required: ${slowPeriod}, Provided: ${closePrices.length}`);
    return { line: [], signal: [], histogram: [] };
  }
  
  const result = talib.execute({
    name: 'MACD',
    startIdx: 0,
    endIdx: closePrices.length - 1,
    inReal: closePrices,
    optInFastPeriod: fastPeriod,
    optInSlowPeriod: slowPeriod,
    optInSignalPeriod: signalPeriod,
  }).result;

  return {
    line: result.outMACD,
    signal: result.outMACDSignal,
    histogram: result.outMACDHist,
  };
};

// Function to calculate Average True Range (ATR)
export const calculateATR = (highPrices, lowPrices, closePrices, period = 14) => {
  if (!Array.isArray(highPrices) || !Array.isArray(lowPrices) || !Array.isArray(closePrices) || closePrices.length < period) {
    console.error(`Insufficient data for ATR calculation. Required: ${period}, Provided: ${closePrices.length}`);
    return [];
  }

  return talib.execute({
    name: 'ATR',
    startIdx: 0,
    endIdx: closePrices.length - 1,
    high: highPrices,
    low: lowPrices,
    close: closePrices,
    optInTimePeriod: period,
  }).result.outReal;
};

export const calculateIndicators = (ohlcv) => {
  if (!ohlcv || ohlcv.length === 0 || !Array.isArray(ohlcv)) {
    console.error('OHLCV data is missing, empty, or not in expected format for indicator calculation.');
    return { sma3: [], sma9: [], macd: { line: [], signal: [], histogram: [] }, atr: [] };
  }

  const closePrices = ohlcv.map(candle => candle.close).filter(price => price !== undefined && !isNaN(price));
  const highPrices = ohlcv.map(candle => candle.high).filter(price => price !== undefined && !isNaN(price));
  const lowPrices = ohlcv.map(candle => candle.low).filter(price => price !== undefined && !isNaN(price));

  if (closePrices.length === 0 || highPrices.length === 0 || lowPrices.length === 0) {
    console.error('No valid OHLCV prices available for indicator calculation.');
    return { sma3: [], sma9: [], macd: { line: [], signal: [], histogram: [] }, atr: [] };
  }

  const sma3 = calculateSMA(closePrices, 3);
  const sma9 = calculateSMA(closePrices, 9);
  const macd = calculateMACD(closePrices);
  const atr = calculateATR(highPrices, lowPrices, closePrices, 14);

  return { sma3, sma9, macd, atr };
};
