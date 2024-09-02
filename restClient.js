const ccxt = require('ccxt');
const { logInfo, logError } = require('./logger');

// Initialize the Binance exchange object
const binance = new ccxt.binanceusdm({
  enableRateLimit: true, // Rate limiting is automatically enabled for exchanges that require it
});

let timeOffset = 0; // Time difference in milliseconds

// Function to sync with Binance server time
const syncWithBinanceTime = async () => {
  try {
    // Fetch Binance server time
    const serverTime = await binance.fapiPublicGetTime();

    // Get local time
    const localTime = Date.now();

    // Calculate time offset
    timeOffset = serverTime.serverTime - localTime;

    logInfo(`Synchronized with Binance time. Time offset: ${timeOffset} ms`);

  } catch (error) {
    logError(`Error syncing with Binance time: ${error.message}`);
  }
};

// Function to get the current time adjusted with Binance time offset
const getCurrentTime = () => {
  return Date.now() + timeOffset;
};

// Schedule periodic time synchronization (e.g., every 5 minutes)
setInterval(syncWithBinanceTime, 5 * 60 * 1000); // 5 minutes

// Call the sync function at the start
syncWithBinanceTime();

// Function to get OHLCV data (Kline/Candlestick data) from Binance using CCXT
const getOHLCVData = async (symbol, timeframe = '1m', limit = 100) => {
  try {
    // Fetch OHLCV data from Binance
    const ohlcv = await binance.fetchOHLCV(symbol, timeframe, undefined, limit);

    // Transform data into readable format
    return ohlcv.map(candle => ({
      openTime: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
    }));
  } catch (error) {
    console.error('Error fetching OHLCV data from Binance using CCXT:', error.message);
    return null;
  }
};

module.exports = { getOHLCVData, getCurrentTime };
