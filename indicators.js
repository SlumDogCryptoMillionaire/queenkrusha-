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

export const calculateIndicators = (ohlcv) => {
  if (!ohlcv || ohlcv.length === 0 || !Array.isArray(ohlcv)) {
    console.error('OHLCV data is missing, empty, or not in expected format for indicator calculation.');
    return { sma3: [], sma9: [], macd: { line: [], signal: [], histogram: [] } };
  }

  const closePrices = ohlcv.map(candle => candle.close).filter(price => price !== undefined && !isNaN(price));
  if (closePrices.length === 0) {
    console.error('No valid close prices available for indicator calculation.');
    return { sma3: [], sma9: [], macd: { line: [], signal: [], histogram: [] } };
  }

  const sma3 = calculateSMA(closePrices, 3);
  const sma9 = calculateSMA(closePrices, 9);
  const macd = calculateMACD(closePrices);

  return { sma3, sma9, macd };
};
