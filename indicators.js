const talib = require('talib');

const calculateSMA = (closePrices, period) => {
  return talib.execute({
    name: 'SMA',
    startIdx: 0,
    endIdx: closePrices.length - 1,
    inReal: closePrices,
    optInTimePeriod: period,
  }).result.outReal;
};

const calculateMACD = (closePrices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
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

const calculateIndicators = (ohlcv) => {
  if (!ohlcv || ohlcv.length === 0) {
    throw new Error('OHLCV data is missing or empty');
  }

  const closePrices = ohlcv.map(candle => candle.close);
  const sma3 = calculateSMA(closePrices, 3);
  const sma9 = calculateSMA(closePrices, 9);
  const macd = calculateMACD(closePrices);

  return { sma3, sma9, macd };
};

module.exports = { calculateIndicators };
