const { initializeLogger } = require('./logger');
const { initializeTradeLogger } = require('./tradeLogger');
const { analyzeMarket, getPendingSignal, resetPendingSignal } = require('./strategy');
const { enterTrade, manageTrade } = require('./tradeManager');
const { loadOHLCVData } = require('./dataManager');
const { connectToWebSocket } = require('./webSocketManager');
const config = require('./config');

let buyVolume = 0;
let sellVolume = 0;

const updateVolumes = (newBuyVolume, newSellVolume) => {
  buyVolume = newBuyVolume;
  sellVolume = newSellVolume;
  console.log(`Updated volumes - Buy: ${buyVolume.toFixed(2)}, Sell: ${sellVolume.toFixed(2)}`);
};

const startBot = async () => {
  // Initialize loggers with new filenames based on date and time
  initializeLogger();

  // Use the correct symbol from config
  const symbol = config.symbol;
  initializeTradeLogger(symbol); // Pass the correct symbol

  console.log('Starting trading bot...');

  // Load or fetch initial OHLCV data
  const ohlcvData = await loadOHLCVData();

  // Connect to Binance WebSocket and update OHLCV data in real-time
  connectToWebSocket(ohlcvData, updateVolumes);

  // Analyze market to generate trade signals and manage trades based on signals
  setInterval(() => {
    // Analyze the market and generate a signal
    const tradeSignal = analyzeMarket(ohlcvData, symbol, buyVolume, sellVolume);
    
    // Get the most recent indicators
    const { sma3, sma9, macd } = require('./indicators').calculateIndicators(ohlcvData);
    const lastCandle = ohlcvData[ohlcvData.length - 1];
    const price = lastCandle.close;
    const macdHistValue = macd.histogram[macd.histogram.length - 1];
    const sma3Value = sma3[sma3.length - 1];
    const sma9Value = sma9[sma9.length - 1];
    
    // Determine if a trade signal was generated
    const tradeSignalStatus = tradeSignal ? 'Yes' : 'No';

    // Log the status to the console
    console.log(`Symbol: ${symbol}, Price: ${price}, Trade Signal: ${tradeSignalStatus}, MACD Histogram: ${macdHistValue.toFixed(2)}, SMA 3: ${sma3Value.toFixed(2)}, SMA 9: ${sma9Value.toFixed(2)}, Buy Volume: ${buyVolume.toFixed(2)}, Sell Volume: ${sellVolume.toFixed(2)}`);

    // Check if there's a pending signal to enter the trade after the current candle closes
    const pendingSignal = getPendingSignal();
    if (pendingSignal) {
      enterTrade(pendingSignal);
      resetPendingSignal();  // Reset the pending signal after entering the trade
    }

    // Manage active trades
    manageTrade(ohlcvData);
  }, 60000); // Check every minute

  console.log('Trading bot started and WebSocket connection established.');
};

// Run the trading bot
startBot().catch(error => console.error('Error starting bot:', error));
