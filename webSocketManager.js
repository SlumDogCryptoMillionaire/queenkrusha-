import WebSocket from 'ws';
import { logInfo, logError } from './logger.js';
import { getOhlcvData, saveOhlcvData } from './dataManager.js';  // Add saveOhlcvData to persist new candles

// Store the latest candle being built
let currentCandle = null;

// Function to initialize WebSocket connection and update OHLCV data
export const connectToWebSocket = (ohlcvData, updateVolumes) => {
  const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');

  ws.on('open', () => {
    logInfo('WebSocket connection opened.');
  });

  ws.on('message', (data) => {
    const trade = JSON.parse(data);
    processTrade(trade, ohlcvData, updateVolumes);
  });

  ws.on('close', () => {
    logError('WebSocket connection closed.');
  });

  ws.on('error', (error) => {
    logError(`WebSocket error: ${error.message}`);
  });
};

// Function to process incoming trades and update OHLCV data
const processTrade = (trade, ohlcvData, updateVolumes) => {
  const price = parseFloat(trade.p);
  const volume = parseFloat(trade.q);
  const timestamp = trade.T;

  if (!currentCandle) {
    // Initialize the first candle
    currentCandle = createNewCandle(timestamp, price, volume);
  }

  const candleEndTime = currentCandle.openTime + 60000; // 1-minute candle duration

  if (timestamp >= candleEndTime) {
    // Candle is complete, push it to OHLCV data
    ohlcvData.push(currentCandle);
    saveOhlcvData(ohlcvData); // Persist the updated OHLCV data

    // Use updated logInfo to pretty-print the new candle JSON object
    logInfo({
      message: 'Added new 1-minute candle to OHLCV data',
      candle: currentCandle,
    });

    // Create a new candle for the next minute
    currentCandle = createNewCandle(timestamp, price, volume);
  } else {
    // Update the current candle with new trade data
    currentCandle.high = Math.max(currentCandle.high, price);
    currentCandle.low = Math.min(currentCandle.low, price);
    currentCandle.close = price;
    currentCandle.volume += volume;
  }

  // Optionally update volumes (if needed)
  updateVolumes(); // Adjust as needed to update volumes correctly
};

// Function to create a new 1-minute candle
const createNewCandle = (timestamp, price, volume) => {
  const openTime = timestamp - (timestamp % 60000); // Align to the nearest minute
  return {
    openTime,
    open: price,
    high: price,
    low: price,
    close: price,
    volume: volume,
  };
};
