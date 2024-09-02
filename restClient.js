const ccxt = require('ccxt');

// Initialize the Binance exchange object
const binance = new ccxt.binance({
  enableRateLimit: true,  // Rate limiting is automatically enabled for exchanges that require it
});

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

module.exports = { getOHLCVData };
