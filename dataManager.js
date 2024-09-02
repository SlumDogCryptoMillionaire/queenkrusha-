const ccxt = require('ccxt');
const fs = require('fs');
const path = require('path');

const BINANCE_SYMBOL = 'BTC/USDT';
const TIMEFRAME = '1m';
const OHLCV_FILE_PATH = path.join(__dirname, 'ohlcv_data.json');

// Initialize Binance Futures Exchange
const binance = new ccxt.binanceusdm({
  enableRateLimit: true,
});

let ohlcvData = []; // Initialize a variable to store OHLCV data

// Fetch historical OHLCV data to maintain at least 1000 candles
const fetchHistoricalOHLCV = async (since) => {
  try {
    const limit = 1000;
    const ohlcv = await binance.fetchOHLCV(BINANCE_SYMBOL, TIMEFRAME, since, limit);
    return ohlcv.map(candle => ({
      openTime: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
    }));
  } catch (error) {
    console.error('Error fetching OHLCV data:', error.message);
    return [];
  }
};

// Load OHLCV data from file or fetch it if not available
const loadOHLCVData = async () => {
  if (fs.existsSync(OHLCV_FILE_PATH)) {
    const fileContent = fs.readFileSync(OHLCV_FILE_PATH, 'utf-8');
    ohlcvData = JSON.parse(fileContent);

    const lastCandleTime = ohlcvData[ohlcvData.length - 1]?.openTime;
    const timeNow = new Date().getTime();

    // Calculate missing candles to fetch based on time difference
    const minutesElapsed = Math.floor((timeNow - lastCandleTime) / (60 * 1000));
    const missingCandles = Math.max(0, 1000 - ohlcvData.length);

    if (minutesElapsed > 0) {
      const since = lastCandleTime + 60000; // Fetch from the next minute
      const newCandles = await fetchHistoricalOHLCV(since);

      // Append new candles and keep only the latest 1000
      ohlcvData = ohlcvData.concat(newCandles).slice(-1000);
    }
  } else {
    ohlcvData = await fetchHistoricalOHLCV();
  }

  // Save OHLCV data to file
  fs.writeFileSync(OHLCV_FILE_PATH, JSON.stringify(ohlcvData), 'utf-8');
  return ohlcvData;
};

// New function to get current OHLCV data
const getOhlcvData = (symbol) => {
  // For now, we're just handling one symbol (BTC/USDT) 
  // but this could be expanded to handle multiple symbols if needed.
  if (symbol === BINANCE_SYMBOL) {
    return ohlcvData;
  }
  return [];
};

// Load OHLCV data initially
loadOHLCVData();  // Load data on startup

module.exports = { loadOHLCVData, getOhlcvData }; // Export both functions
