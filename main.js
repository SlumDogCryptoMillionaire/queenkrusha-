import 'dotenv/config';  // Load environment variables from .env file
import { initializeLogger } from './logger.js';
import { initializeTradeLogger } from './tradeLogger.js';
import { analyzeMarket, getPendingSignal, resetPendingSignal } from './strategy.js';
import { enterTrade, manageTrade } from './tradeManager.js';
import { initializeRestClient, fetchOHLCVData } from './restClient.js';
import { connectToWebSocket } from './webSocketManager.js';
import { runMenu } from './tradingMenu.mjs';
import { loadOHLCVData, getOhlcvData } from './dataManager.js';

// Default configuration
const defaultConfig = {
  exchange: 'binanceusdm',  // Default exchange
  symbol: 'BTC/USDT',  // Default trading symbol
  timeframe: '1m',  // Default timeframe
};

// Function to initialize the trading bot
async function initializeBot(config) {
  console.log(`Using configuration: Exchange - ${config.exchange}, Symbol - ${config.symbol}`);
  
  // Initialize necessary components
  initializeLogger();  // Initialize the logger
  initializeRestClient(config.exchange);  // Initialize REST client
  initializeTradeLogger(config.symbol);  // Initialize trade logger with sanitized symbol
  
  // Load OHLCV data
  await loadOHLCVData(config.symbol, config.timeframe);
  const ohlcvData = getOhlcvData();
  
  if (ohlcvData.length === 0) {
    console.error('Failed to load OHLCV data.');
    return;
  }

  return ohlcvData;
}

// Function to start the trading bot
async function startBot(config) {
  const ohlcvData = await initializeBot(config);  // Initialize the bot and get OHLCV data
  if (!ohlcvData) return;

  // Define a function to update volumes
  let buyVolume = 0;
  let sellVolume = 0;

  const updateVolumes = (newBuyVolume = 0, newSellVolume = 0) => {  // Add default values
    buyVolume = newBuyVolume;
    sellVolume = newSellVolume;
    // Uncomment if you want to log updated volumes
    // console.log(`Updated volumes - Buy: ${buyVolume.toFixed(2)}, Sell: ${sellVolume.toFixed(2)}`);
  };

  // Establish WebSocket connection
  connectToWebSocket(ohlcvData, updateVolumes);

  // Periodically analyze the market and manage trades
  setInterval(() => {
    const tradeSignal = analyzeMarket(ohlcvData, config.symbol, buyVolume, sellVolume);
    const pendingSignal = getPendingSignal();
    if (pendingSignal) {
      enterTrade(pendingSignal);
      resetPendingSignal();
    }
    manageTrade(ohlcvData);
  }, 60000);

  console.log('Trading bot started and WebSocket connection established.');
}

// Main function to run the app
async function runApp() {
  if (process.argv.includes('--trading-menu')) {
    // Run interactive trading menu to configure the bot
    try {
      const config = await runMenu();
      await startBot(config);
    } catch (error) {
      console.error('Error running trading menu:', error);
    }
  } else {
    // No flag provided, use default configuration
    console.log('No configuration provided. Running with default settings...');
    await startBot(defaultConfig);
  }
}

// Start the application
runApp().catch((error) => console.error('Error starting bot:', error));
